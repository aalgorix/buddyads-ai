import { randomBytes } from 'node:crypto';
import { prisma } from '@buddyads/db';
import { env, getModels } from '../env';
import { crawlWebsite, type CrawlResult } from '../tools/crawl';
import { agentPlan, queryAllModels, type LlmAnswer } from '../tools/llm';
import { buildReport } from '../tools/score';
import { reportUrlForToken, sendReportEmail } from '../tools/email';

type Trace = { step: number; thought?: string; action: string; detail?: string };

type AgentState = {
  crawl: CrawlResult | null;
  research: LlmAnswer[];
  notes: string[];
  finalized: boolean;
};

function parseAgentJson(raw: string): {
  thought?: string;
  action: string;
  question?: string;
  notes?: string;
} {
  const fence = raw.match(/\{[\s\S]*\}/);
  const jsonText = fence ? fence[0] : raw;
  try {
    const parsed = JSON.parse(jsonText) as {
      thought?: string;
      action?: string;
      question?: string;
      notes?: string;
    };
    return {
      thought: parsed.thought,
      action: (parsed.action || 'finalize_report').toLowerCase(),
      question: parsed.question,
      notes: parsed.notes,
    };
  } catch {
    return { action: 'finalize_report', thought: 'fallback parse', notes: raw.slice(0, 200) };
  }
}

type Intake = {
  companyName?: string | null;
  businessDescription?: string | null;
  productsServices?: string | null;
  idealCustomers?: string | null;
  countries?: string | null;
  competitors?: string | null;
  aiPlatforms?: string[];
  marketingChallenge?: string | null;
};

function parseIntake(raw: string | null | undefined): Intake | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Intake;
  } catch {
    return null;
  }
}

function buildResearchQuestions(
  brand: string,
  crawlTitle: string,
  intake: Intake | null,
): string[] {
  const product = intake?.productsServices || crawlTitle || brand;
  const audience = intake?.idealCustomers || 'business buyers';
  const geo = intake?.countries || 'their target markets';
  const comps = intake?.competitors || 'major competitors';
  const desc = intake?.businessDescription || brand;

  return [
    `A buyer is looking for solutions like: ${product}. ${desc}. What companies or products would you recommend for ${audience} in ${geo}? Name specific brands.`,
    `Who are the top alternatives to ${brand} (${product})? Consider competitors such as ${comps} and any others you would name first.`,
    `What should ${audience} evaluate before choosing ${brand} or a similar tool for: ${product}?`,
    intake?.marketingChallenge
      ? `Regarding this challenge: "${intake.marketingChallenge}" — which brands currently dominate AI recommendations in this category, and why might ${brand} be missing?`
      : `In AI-powered search and chat recommendations for ${product}, which brands tend to get mentioned most often?`,
  ];
}

/**
 * Single Visibility Agent — goal-directed tool loop.
 * The planner (OpenRouter LLM) chooses tools; code executes them with hard budgets.
 * Without OPENROUTER_API_KEY, runs a deterministic fallback path (still multi-tool, not free planning).
 */
export async function runVisibilityAgent(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { customer: true },
  });
  if (!job) throw new Error(`Job not found: ${jobId}`);

  const intake = parseIntake(job.intake);
  const maxSteps = Number(env('AGENT_MAX_STEPS', '12')) || 12;
  const state: AgentState = { crawl: null, research: [], notes: [], finalized: false };
  const trace: Trace[] = [];

  const updateStep = async (progressStep: string) => {
    await prisma.job.update({
      where: { id: jobId },
      data: { progressStep, agentTrace: JSON.stringify(trace) },
    });
  };

  try {
    if (!env('OPENROUTER_API_KEY')) {
      await runFallbackAgent(
        jobId,
        job.websiteUrl,
        job.customer,
        intake,
        state,
        trace,
        updateStep,
      );
    } else {
      await runPlannerAgent(
        jobId,
        job.websiteUrl,
        job.customer,
        intake,
        state,
        trace,
        maxSteps,
        updateStep,
      );
    }

    const brand =
      state.crawl?.brandGuess ||
      intake?.companyName ||
      job.customer.company ||
      job.customer.name ||
      job.websiteUrl;

    const report = buildReport({
      brandName: brand,
      websiteUrl: job.websiteUrl,
      crawl: state.crawl,
      research: state.research,
      agentNotes: state.notes.join(' '),
    });

    const token = randomBytes(18).toString('hex');
    await prisma.report.upsert({
      where: { jobId },
      create: {
        jobId,
        token,
        brandName: report.brandName,
        overall: report.overall,
        aeo: report.aeo,
        geo: report.geo,
        llmReady: report.llmReady,
        grade: report.grade,
        summary: report.summary,
        payload: JSON.stringify(report),
      },
      update: {
        token,
        brandName: report.brandName,
        overall: report.overall,
        aeo: report.aeo,
        geo: report.geo,
        llmReady: report.llmReady,
        grade: report.grade,
        summary: report.summary,
        payload: JSON.stringify(report),
      },
    });

    const url = reportUrlForToken(token);
    const email = await sendReportEmail({
      to: job.customer.email,
      name: job.customer.name,
      brandName: report.brandName,
      reportUrl: url,
      overall: report.overall,
    });

    trace.push({
      step: trace.length + 1,
      action: 'email',
      detail: `${email.status}${email.error ? `: ${email.error}` : ''}`,
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progressStep: 'done',
        completedAt: new Date(),
        agentTrace: JSON.stringify(trace),
        error:
          email.status === 'SENT'
            ? null
            : email.status === 'SKIPPED'
              ? `Report ready (email skipped: ${email.error})`
              : `Report ready (email failed: ${email.error})`,
      },
    });
  } catch (err) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        progressStep: 'failed',
        error: err instanceof Error ? err.message : 'Agent failed',
        completedAt: new Date(),
        agentTrace: JSON.stringify(trace),
      },
    });
    throw err;
  }
}

async function runFallbackAgent(
  jobId: string,
  websiteUrl: string,
  customer: { name: string; company: string | null },
  intake: Intake | null,
  state: AgentState,
  trace: Trace[],
  updateStep: (s: string) => Promise<void>,
) {
  await updateStep('crawl');
  state.crawl = await crawlWebsite(websiteUrl);
  trace.push({ step: 1, action: 'crawl_website', detail: state.crawl.finalUrl });

  const brand =
    state.crawl.brandGuess || intake?.companyName || customer.company || customer.name;
  const questions = buildResearchQuestions(brand, state.crawl.title, intake);

  await updateStep('research');
  for (const q of questions) {
    const answers = await queryAllModels({ question: q, brandName: brand });
    state.research.push(...answers);
    trace.push({ step: trace.length + 1, action: 'query_llms', detail: q.slice(0, 120) });
  }

  state.notes.push(
    intake
      ? 'Used full intake context for research prompts (planner skipped: no OPENROUTER_API_KEY).'
      : 'Planner LLM skipped (no OPENROUTER_API_KEY). Used crawl-only research prompts.',
  );
  state.finalized = true;
  await updateStep('finalize');
  void jobId;
}

async function runPlannerAgent(
  jobId: string,
  websiteUrl: string,
  customer: { name: string; company: string | null },
  intake: Intake | null,
  state: AgentState,
  trace: Trace[],
  maxSteps: number,
  updateStep: (s: string) => Promise<void>,
) {
  const models = getModels().join(', ');
  const system = `You are the BuddyAds Visibility Agent. Goal: produce a solid AI visibility report for one brand/website.
You choose ONE tool per step. Respond with ONLY valid JSON:
{"thought":"...","action":"crawl_website|query_llms|add_note|finalize_report","question":"...optional for query_llms...","notes":"...optional..."}

Rules:
- Call crawl_website first if site not crawled.
- Use query_llms with a concrete buyer-style question grounded in intake (products, audience, countries, competitors).
- The system will fan-out that question to research models: ${models}.
- Prefer 2–4 research questions, not more.
- When you have crawl data and enough research, action=finalize_report.
- Never invent crawl data. Do not include markdown.`;

  for (let step = 1; step <= maxSteps; step++) {
    const observation = {
      websiteUrl,
      customerName: customer.name,
      company: intake?.companyName || customer.company,
      intake,
      hasCrawl: Boolean(state.crawl),
      brandGuess: state.crawl?.brandGuess,
      crawlTitle: state.crawl?.title,
      researchCount: state.research.length,
      successfulResearch: state.research.filter((r) => r.answer).length,
      models,
    };

    await updateStep(`agent_step_${step}`);
    const raw = await agentPlan(
      system,
      `Observation:\n${JSON.stringify(observation, null, 2)}\n\nChoose the next action as JSON.`,
    );
    const decision = parseAgentJson(raw);
    trace.push({
      step,
      thought: decision.thought,
      action: decision.action,
      detail: decision.question || decision.notes,
    });

    if (decision.action === 'crawl_website' || (!state.crawl && decision.action !== 'finalize_report')) {
      state.crawl = await crawlWebsite(websiteUrl);
      continue;
    }

    if (decision.action === 'query_llms') {
      const brand =
        state.crawl?.brandGuess || intake?.companyName || customer.company || customer.name || websiteUrl;
      const fallbacks = buildResearchQuestions(brand, state.crawl?.title || brand, intake);
      const question =
        decision.question?.trim() ||
        fallbacks[Math.min(state.research.length, fallbacks.length - 1)];
      const answers = await queryAllModels({ question, brandName: brand });
      state.research.push(...answers);
      continue;
    }

    if (decision.action === 'add_note' && decision.notes) {
      state.notes.push(decision.notes);
      continue;
    }

    if (decision.action === 'finalize_report') {
      if (!state.crawl) state.crawl = await crawlWebsite(websiteUrl);
      if (state.research.length === 0) {
        const brand =
          state.crawl.brandGuess || intake?.companyName || customer.company || customer.name || websiteUrl;
        for (const question of buildResearchQuestions(brand, state.crawl.title, intake).slice(0, 2)) {
          const answers = await queryAllModels({ question, brandName: brand });
          state.research.push(...answers);
        }
      }
      if (decision.notes) state.notes.push(decision.notes);
      state.finalized = true;
      break;
    }

    if (!state.crawl) state.crawl = await crawlWebsite(websiteUrl);
  }

  if (!state.finalized) {
    if (!state.crawl) state.crawl = await crawlWebsite(websiteUrl);
    state.notes.push('Reached step budget; finalized automatically.');
  }

  void jobId;
}
