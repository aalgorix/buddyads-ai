import type { CrawlResult } from './crawl';
import type { LlmAnswer } from './llm';

export type Recommendation = {
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  reason: string;
  businessImpact: string;
  difficulty: string;
  estimatedTime: string;
  expectedGain: string;
};

export type LlmEstimate = {
  model: string;
  score: number;
  insight: string;
};

export type ReportPayload = {
  brandName: string;
  websiteUrl: string;
  overall: number;
  aeo: number;
  geo: number;
  llmReady: number;
  grade: string;
  summary: string;
  recommendations: Recommendation[];
  research: LlmAnswer[];
  llmEstimates: LlmEstimate[];
  roadmap30Day: string[];
  roadmap90Day: string[];
  competitorInsights: string;
  crawl: {
    title: string;
    description: string;
    wordCount: number;
    hasFaq: boolean;
    hasSchema: boolean;
    headings: string[];
  };
  confidence: 'Low' | 'Medium' | 'High';
  generatedAt: string;
};

function grade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function rec(
  partial: Omit<Recommendation, 'category' | 'reason' | 'businessImpact' | 'difficulty' | 'estimatedTime' | 'expectedGain'> &
    Partial<Recommendation>,
): Recommendation {
  return {
    category: partial.category || 'Content',
    reason: partial.reason || partial.detail,
    businessImpact: partial.businessImpact || 'Improves chance of being named in AI answers.',
    difficulty: partial.difficulty || 'Medium',
    estimatedTime: partial.estimatedTime || '1–2 weeks',
    expectedGain: partial.expectedGain || '+5–12 visibility points',
    title: partial.title,
    detail: partial.detail,
    priority: partial.priority,
  };
}

export function buildReport(params: {
  brandName: string;
  websiteUrl: string;
  crawl: CrawlResult | null;
  research: LlmAnswer[];
  agentNotes?: string;
  competitors?: string | null;
}): ReportPayload {
  const crawl = params.crawl;
  const research = params.research.filter((r) => r.answer || r.error);

  let aeo = 35;
  if (crawl) {
    if (crawl.hasFaq) aeo += 18;
    if (crawl.headings.length >= 4) aeo += 12;
    if (crawl.wordCount > 400) aeo += 15;
    if (crawl.description.length > 40) aeo += 10;
    aeo = Math.min(100, aeo);
  }

  let geo = 30;
  if (crawl) {
    if (crawl.hasSchema) geo += 20;
    if (crawl.wordCount > 600) geo += 15;
    if (crawl.linkCount > 20) geo += 10;
    if (/about|team|contact|privacy/i.test(crawl.text)) geo += 15;
    geo = Math.min(100, geo);
  }

  const usable = research.filter((r) => r.answer && !r.error);
  const mentions = usable.filter((r) => r.brandMentioned).length;
  let llmReady = usable.length === 0 ? 25 : Math.round((mentions / Math.max(usable.length, 1)) * 70 + 15);
  if (usable.length >= 3) llmReady = Math.min(100, llmReady + 8);

  const overall = Math.round(aeo * 0.3 + geo * 0.3 + llmReady * 0.4);

  const recommendations: Recommendation[] = [];
  if (crawl && !crawl.hasFaq) {
    recommendations.push(
      rec({
        title: 'Add answer-ready FAQ content',
        detail: 'LLMs extract crisp Q&A better when your site states common questions explicitly.',
        priority: 'high',
        category: 'AEO',
        businessImpact: 'Higher chance of being quoted in ChatGPT / Perplexity-style answers.',
        difficulty: 'Easy',
        estimatedTime: '3–5 days',
        expectedGain: '+8–15 AEO',
      }),
    );
  }
  if (crawl && !crawl.hasSchema) {
    recommendations.push(
      rec({
        title: 'Publish JSON-LD entity markup',
        detail: 'Organization / Product schema helps generative engines ground your brand identity.',
        priority: 'high',
        category: 'GEO',
        businessImpact: 'Clearer entity identity for generative engines.',
        difficulty: 'Easy',
        estimatedTime: '1–3 days',
        expectedGain: '+10–18 GEO',
      }),
    );
  }
  if (usable.length && mentions === 0) {
    recommendations.push(
      rec({
        title: 'Close the brand-mention gap across AI answers',
        detail: `Across ${usable.length} model replies, ${params.brandName} was not named. Strengthen third-party mentions, comparisons, and citable pages.`,
        priority: 'high',
        category: 'LLM visibility',
        businessImpact: 'Directly targets the gap where assistants omit your brand.',
        difficulty: 'Hard',
        estimatedTime: '4–8 weeks',
        expectedGain: '+12–25 LLM readiness',
      }),
    );
  } else if (usable.length && mentions < usable.length) {
    recommendations.push(
      rec({
        title: 'Improve consistency across models',
        detail: `Only ${mentions}/${usable.length} researched replies mentioned the brand. Target models/contexts where you are invisible first.`,
        priority: 'medium',
        category: 'LLM visibility',
      }),
    );
  }
  if (crawl && crawl.wordCount < 300) {
    recommendations.push(
      rec({
        title: 'Expand primary page substance',
        detail: 'Thin pages give models little reliable surface to quote or recommend.',
        priority: 'medium',
        category: 'Content',
        estimatedTime: '1 week',
      }),
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      rec({
        title: 'Maintain citable proof and refresh comparisons',
        detail: 'Keep entity clarity high and ship comparison / use-case pages AI can cite with confidence.',
        priority: 'low',
        category: 'Content',
      }),
    );
  }

  const byModel = new Map<string, LlmAnswer[]>();
  for (const r of usable) {
    const list = byModel.get(r.model) || [];
    list.push(r);
    byModel.set(r.model, list);
  }
  const llmEstimates: LlmEstimate[] = [...byModel.entries()].map(([model, rows]) => {
    const hit = rows.filter((r) => r.brandMentioned).length;
    const score = Math.round((hit / rows.length) * 85 + (rows.length >= 2 ? 10 : 0));
    return {
      model,
      score: Math.min(100, score),
      insight:
        hit === 0
          ? `${params.brandName} was not named in ${rows.length} sampled ${model} replies.`
          : `Mentioned in ${hit}/${rows.length} sampled ${model} replies.`,
    };
  });

  const comps = params.competitors?.trim() || 'named competitors';
  const competitorInsights =
    usable.length === 0
      ? `No successful multi-LLM samples were available. Re-run with OpenRouter configured to compare ${params.brandName} against ${comps}.`
      : mentions === 0
        ? `In sampled answers, assistants more often named alternatives related to ${comps} than ${params.brandName}. Build comparison pages and third-party proof so models have a reason to include you.`
        : `${params.brandName} appeared in some sampled answers, but coverage is uneven versus ${comps}. Double down on categories where mention rate is lowest.`;

  const roadmap30Day = [
    crawl && !crawl.hasFaq
      ? 'Ship a public FAQ answering the top 10 buyer questions in plain language.'
      : 'Refresh FAQ / answer blocks with current proof points and pricing clarity.',
    crawl && !crawl.hasSchema
      ? 'Add Organization + Product (or Service) JSON-LD on the homepage and key landing pages.'
      : 'Validate existing schema in Google Rich Results / Schema validators and fix gaps.',
    'Publish one comparison or “vs alternatives” page targeting your top competitor set.',
    'Ensure About / Contact / Trust pages are crawlable and clearly name the company entity.',
  ];

  const roadmap90Day = [
    'Build a citation engine: case studies, stats pages, and partner mentions models can quote.',
    'Expand topical clusters around products/services so assistants associate you with the category.',
    'Run a second multi-LLM visibility check and close remaining mention gaps model-by-model.',
    'Align PR / directories / review sites so third-party language matches your preferred brand name.',
  ];

  const note = params.agentNotes?.trim();
  const mentionLine =
    usable.length === 0
      ? 'No successful multi-LLM sample answers were available for this run (missing key or provider errors).'
      : `Brand mentions: ${mentions} of ${usable.length} successful model replies.`;

  const summary = [
    `${params.brandName} scored ${overall}/100 on AI Visibility (grade ${grade(overall)}).`,
    `AEO ${aeo}, GEO ${geo}, LLM readiness ${llmReady}.`,
    mentionLine,
    note ? `Agent notes: ${note.slice(0, 400)}` : '',
    'Scores combine on-site extractability signals with sampled model answers. They are evidence snapshots, not private model rankings.',
  ]
    .filter(Boolean)
    .join(' ');

  const confidence: ReportPayload['confidence'] =
    usable.length >= 4 ? 'High' : usable.length >= 2 ? 'Medium' : 'Low';

  return {
    brandName: params.brandName,
    websiteUrl: params.websiteUrl,
    overall,
    aeo,
    geo,
    llmReady,
    grade: grade(overall),
    summary,
    recommendations: recommendations.slice(0, 6),
    research,
    llmEstimates,
    roadmap30Day,
    roadmap90Day,
    competitorInsights,
    crawl: {
      title: crawl?.title || '',
      description: crawl?.description || '',
      wordCount: crawl?.wordCount || 0,
      hasFaq: crawl?.hasFaq || false,
      hasSchema: crawl?.hasSchema || false,
      headings: crawl?.headings || [],
    },
    confidence,
    generatedAt: new Date().toISOString(),
  };
}
