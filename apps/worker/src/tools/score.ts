import type { CrawlResult } from './crawl';
import type { LlmAnswer } from './llm';
import { buildIntelligence, fallbackNarrative, type IntakeContext } from './intelligence';
import {
  computeBrandCategory,
  computeClosestCompetitors,
  computeLlmStrategies,
  computeMentionBreakdown,
} from './report-derived';
import { writeNarrative } from './narrative';
import type { ReportPayload } from '../types/report';

export type { ReportPayload } from '../types/report';
export type Recommendation = ReportPayload['recommendations'][number];
export type LlmEstimate = ReportPayload['llmEstimates'][number];

export async function buildReport(params: {
  analysisId: string;
  brandName: string;
  websiteUrl: string;
  crawl: CrawlResult | null;
  research: LlmAnswer[];
  agentNotes?: string;
  competitors?: string | null;
  intake?: IntakeContext | null;
  engineScores?: { aeo?: number; geo?: number; technical?: number } | null;
}): Promise<ReportPayload> {
  const intel = buildIntelligence({
    analysisId: params.analysisId,
    brandName: params.brandName,
    websiteUrl: params.websiteUrl,
    crawl: params.crawl,
    research: params.research,
    intake: params.intake || { competitors: params.competitors },
    agentNotes: params.agentNotes,
    engineScores: params.engineScores,
  });

  let narrative = fallbackNarrative(intel);
  try {
    narrative = await writeNarrative(intel);
  } catch {
    narrative = fallbackNarrative(intel);
  }

  const recommendations = narrative.howToDoBetter.map((h) => ({
    title: h.recommendedAction,
    detail: h.implementation,
    priority: h.priority.toLowerCase(),
    category: h.problem,
    reason: h.evidence,
    businessImpact: h.whyItMatters,
    difficulty: h.difficulty,
    estimatedTime: h.difficulty === 'Easy' ? '1–3 days' : h.difficulty === 'Hard' ? '3–6 weeks' : '1–2 weeks',
    expectedGain: h.expectedImpact,
  }));

  const llmEstimates = intel.platformPerformance.map((p) => ({
    model: `${p.platform} · ${p.model}`,
    score: p.visibility ?? 0,
    insight: `Mention rate ${p.mentionRate == null ? 'N/A' : `${p.mentionRate}%`} · citations ${p.citationRate == null ? 'N/A' : `${p.citationRate}%`} · avg position ${p.avgPosition == null ? 'N/A' : p.avgPosition}.`,
  }));

  const roadmap30Day = narrative.roadmap30.flatMap((w) => w.tasks.map((t) => `Week ${w.week} (${w.theme}): ${t.task}`));
  const roadmap90Day = narrative.strategy90.flatMap((m) => m.tasks.map((t) => `Month ${m.month} (${m.theme}): ${t}`));

  const { usableCount: _u, mentionCount: _m, citationCount: _c, rawStrongest: _s, rawWeakest: _w, ...facts } = intel;
  void _u;
  void _m;
  void _c;
  void _s;
  void _w;

  const mentionBreakdown = computeMentionBreakdown(intel.research);
  const mentionRate =
    intel.usableCount > 0 ? Math.round((intel.mentionCount / intel.usableCount) * 1000) / 10 : null;
  const positions = intel.research
    .filter((r) => r.answer && !r.error && r.brandMentioned)
    .map((r) => r.brandPosition)
    .filter((n): n is number => n != null);
  const avgPosition = positions.length
    ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
    : null;

  const brandCategory = computeBrandCategory({
    brandName: params.brandName,
    buddyScore: intel.scores.buddyScore,
    mentionRate,
    citationRate: intel.ownCitationRate,
    avgPosition,
    usableCount: intel.usableCount,
    strongestVisibility: intel.rawStrongest?.visibility ?? null,
  });

  const llmStrategies = computeLlmStrategies(intel.platformPerformance, params.brandName);
  const closestCompetitors = computeClosestCompetitors({
    brandName: params.brandName,
    competitors: intel.competitors,
    coOccurrence: intel.coOccurrence,
    citationGaps: intel.citationGaps,
    losingQueries: intel.losingQueries,
    ownMentionRate: mentionRate,
    hasComparisonPage: Boolean(intel.crawl?.hasComparison),
  });
  const competitorInsights = closestCompetitors.length
    ? `Closest competitors: ${closestCompetitors.map((c) => c.name).join(', ')}. ${narrative.competitorInsights}`
    : narrative.competitorInsights;

  return {
    ...facts,
    summary: narrative.summary,
    executiveSummary: narrative.executiveSummary,
    brandCategory,
    mentionBreakdown,
    llmStrategies,
    closestCompetitors,
    finalTakeaway: narrative.finalTakeaway,
    strongestPlatform: narrative.strongestPlatform,
    weakestPlatform: narrative.weakestPlatform,
    opportunities: narrative.opportunities,
    howToDoBetter: narrative.howToDoBetter,
    plan7Day: narrative.plan7Day,
    roadmap30: narrative.roadmap30,
    strategy90: narrative.strategy90,
    recommendations,
    llmEstimates,
    roadmap30Day,
    roadmap90Day,
    competitorInsights,
  };
}
