import { interpretReport } from './llm';
import { fallbackNarrative, type buildIntelligence } from './intelligence';
import type { DayPlan, HowToItem, MonthPlan, Opportunity, PlatformSpotlight, ReportPayload, WeekPlan } from '../types/report';

type Intel = ReturnType<typeof buildIntelligence>;

function parseJson(raw: string): Record<string, unknown> | null {
  const fence = raw.match(/\{[\s\S]*\}/);
  if (!fence) return null;
  try {
    return JSON.parse(fence[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asStringArr(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.map((x) => String(x).trim()).filter(Boolean);
  return out.length ? out.slice(0, 6) : fallback;
}

/**
 * LLM may only interpret. Metrics stay deterministic.
 * Any failure falls back to template narrative grounded in the same numbers.
 */
export async function writeNarrative(intel: Intel): Promise<ReturnType<typeof fallbackNarrative>> {
  const fallback = fallbackNarrative(intel);
  try {
    const facts = {
      brandName: intel.brandName,
      websiteUrl: intel.websiteUrl,
      scores: intel.scores,
      grade: intel.grade,
      confidence: intel.confidence,
      confidenceReason: intel.confidenceReason,
      coverage: intel.coverage,
      platformPerformance: intel.platformPerformance,
      strongest: intel.rawStrongest,
      weakest: intel.rawWeakest,
      strengths: intel.strengths,
      gaps: intel.gaps,
      missingSignals: intel.missingSignals.slice(0, 8),
      competitors: intel.competitors.slice(0, 3).map((c) => ({
        name: c.name,
        mentions: c.mentions,
        mentionRate: c.mentionRate,
        platforms: c.platforms,
      })),
      shareOfVoice: intel.shareOfVoice,
      coOccurrence: intel.coOccurrence,
      winningQueries: intel.winningQueries.slice(0, 5),
      losingQueries: intel.losingQueries.slice(0, 5),
      citedDomains: intel.citedDomains.slice(0, 8),
      citationGaps: intel.citationGaps.slice(0, 4),
      entityMissing: intel.entityProfile.missing,
    };

    const raw = await interpretReport(
      `You are a senior AI visibility strategist at BuddyAds.ai writing for a CMO/CEO.
You receive DETERMINISTIC FACTS. You must not invent, change, or round metrics into new statistics.
If a value is null, write "N/A" or "insufficient data".
Never promise guaranteed score increases (no "+10 points"). Use "potential impact", "expected direction", "opportunity".
Distinguish observed evidence from your interpretation.
Return ONLY JSON with this shape:
{
  "summary": "2-4 sentence executive paragraph using only provided numbers",
  "executiveSummary": {
    "where": "...",
    "visibility": "...",
    "strengths": ["...","...","..."],
    "gaps": ["...","...","..."],
    "next": ["...","...","..."]
  },
  "finalTakeaway": "...",
  "strongestWhy": "why the strongest platform performed well, citing evidence",
  "weakestWhy": "why the weakest platform is weaker, citing evidence",
  "competitorInsights": "Name the 3 closest competitors from FACTS.competitors. One sentence on who is closest and why.",
  "opportunities": [{"title":"","impact":"High|Medium|Low","difficulty":"Easy|Medium|Hard","evidence":"","strategicValue":""}],
  "howToDoBetter": [{"problem":"","whyItMatters":"","evidence":"","recommendedAction":"","implementation":"","priority":"High|Medium|Low","difficulty":"Easy|Medium|Hard","expectedImpact":""}],
  "plan7Day": [{"day":1,"title":"","task":"","connectedProblem":""}],
  "roadmap30": [{"week":1,"theme":"","tasks":[{"task":"","connectedProblem":""}]}],
  "strategy90": [{"month":1,"theme":"Fix|Build|Expand","tasks":["",""]}]
}`,
      `FACTS:\n${JSON.stringify(facts)}`,
    );

    const parsed = parseJson(raw);
    if (!parsed) return fallback;

    const strongest: PlatformSpotlight | null = fallback.strongestPlatform
      ? { ...fallback.strongestPlatform, interpretation: asString(parsed.strongestWhy) || fallback.strongestPlatform.interpretation }
      : null;
    const weakest: PlatformSpotlight | null = fallback.weakestPlatform
      ? { ...fallback.weakestPlatform, interpretation: asString(parsed.weakestWhy) || fallback.weakestPlatform.interpretation }
      : null;

    const exec = (parsed.executiveSummary || {}) as Record<string, unknown>;
    const executiveSummary: ReportPayload['executiveSummary'] = {
      where: asString(exec.where) || fallback.executiveSummary.where,
      visibility: asString(exec.visibility) || fallback.executiveSummary.visibility,
      strengths: asStringArr(exec.strengths, fallback.executiveSummary.strengths).slice(0, 3),
      gaps: asStringArr(exec.gaps, fallback.executiveSummary.gaps).slice(0, 3),
      next: asStringArr(exec.next, fallback.executiveSummary.next).slice(0, 3),
    };

    const howToDoBetter = mergeHowTo(parsed.howToDoBetter, fallback.howToDoBetter);
    const opportunities = mergeOpps(parsed.opportunities, fallback.opportunities, intel);
    const plan7Day = mergeDays(parsed.plan7Day, fallback.plan7Day);
    const roadmap30 = mergeWeeks(parsed.roadmap30, fallback.roadmap30);
    const strategy90 = mergeMonths(parsed.strategy90, fallback.strategy90);

    return {
      summary: asString(parsed.summary) || fallback.summary,
      executiveSummary,
      finalTakeaway: asString(parsed.finalTakeaway) || fallback.finalTakeaway,
      strongestPlatform: strongest,
      weakestPlatform: weakest,
      opportunities,
      howToDoBetter,
      plan7Day,
      roadmap30,
      strategy90,
      competitorInsights: asString(parsed.competitorInsights) || fallback.competitorInsights,
    };
  } catch {
    return fallback;
  }
}

function mergeHowTo(raw: unknown, fallback: HowToItem[]): HowToItem[] {
  if (!Array.isArray(raw) || !raw.length) return fallback;
  const out: HowToItem[] = [];
  for (const item of raw.slice(0, 6)) {
    const o = item as Record<string, unknown>;
    const problem = asString(o.problem);
    if (!problem) continue;
    out.push({
      problem,
      whyItMatters: asString(o.whyItMatters) || 'This affects whether AI can name, place, or cite the brand.',
      evidence: asString(o.evidence) || 'See measured gaps in this report.',
      recommendedAction: asString(o.recommendedAction) || problem,
      implementation: asString(o.implementation) || asString(o.recommendedAction),
      priority: pri(o.priority),
      difficulty: diff(o.difficulty),
      expectedImpact: asString(o.expectedImpact) || 'Potential directional impact on the related BuddyAds metrics. Not guaranteed.',
    });
  }
  return out.length ? out : fallback;
}

function mergeOpps(raw: unknown, fallback: Opportunity[], intel: Intel): Opportunity[] {
  if (!Array.isArray(raw) || !raw.length) return fallback;
  const out: Opportunity[] = [];
  raw.slice(0, 5).forEach((item, i) => {
    const o = item as Record<string, unknown>;
    const title = asString(o.title);
    if (!title) return;
    out.push({
      rank: i + 1,
      title,
      impact: pri(o.impact),
      difficulty: diff(o.difficulty),
      confidence: intel.confidence,
      platforms: intel.coverage.platformNames,
      evidence: asString(o.evidence) || fallback[i]?.evidence || 'Observed in this analysis sample.',
      strategicValue: asString(o.strategicValue) || 'Opportunity to improve AI visibility where evidence shows a gap.',
    });
  });
  return out.length ? out : fallback;
}

function mergeDays(raw: unknown, fallback: DayPlan[]): DayPlan[] {
  if (!Array.isArray(raw) || raw.length < 5) return fallback;
  return raw.slice(0, 7).map((item, i) => {
    const o = item as Record<string, unknown>;
    return {
      day: Number(o.day) || i + 1,
      title: asString(o.title) || fallback[i]?.title || `Day ${i + 1}`,
      task: asString(o.task) || fallback[i]?.task || '',
      connectedProblem: asString(o.connectedProblem) || fallback[i]?.connectedProblem || '',
    };
  });
}

function mergeWeeks(raw: unknown, fallback: WeekPlan[]): WeekPlan[] {
  if (!Array.isArray(raw) || raw.length < 4) return fallback;
  return raw.slice(0, 4).map((item, i) => {
    const o = item as Record<string, unknown>;
    const tasksRaw = Array.isArray(o.tasks) ? o.tasks : [];
    const tasks = tasksRaw.map((t) => {
      if (typeof t === 'string') return { task: t, connectedProblem: fallback[i]?.tasks[0]?.connectedProblem || '' };
      const x = t as Record<string, unknown>;
      return { task: asString(x.task), connectedProblem: asString(x.connectedProblem) };
    }).filter((t) => t.task);
    return {
      week: Number(o.week) || i + 1,
      theme: asString(o.theme) || fallback[i]?.theme || '',
      tasks: tasks.length ? tasks : fallback[i]?.tasks || [],
    };
  });
}

function mergeMonths(raw: unknown, fallback: MonthPlan[]): MonthPlan[] {
  if (!Array.isArray(raw) || raw.length < 3) return fallback;
  return raw.slice(0, 3).map((item, i) => {
    const o = item as Record<string, unknown>;
    return {
      month: Number(o.month) || i + 1,
      theme: asString(o.theme) || fallback[i]?.theme || '',
      tasks: asStringArr(o.tasks, fallback[i]?.tasks || []),
    };
  });
}

function pri(v: unknown): HowToItem['priority'] {
  const s = String(v || '').toLowerCase();
  if (s === 'high') return 'High';
  if (s === 'low') return 'Low';
  return 'Medium';
}

function diff(v: unknown): HowToItem['difficulty'] {
  const s = String(v || '').toLowerCase();
  if (s === 'easy') return 'Easy';
  if (s === 'hard') return 'Hard';
  return 'Medium';
}
