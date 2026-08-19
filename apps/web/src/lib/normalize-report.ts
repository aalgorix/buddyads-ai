import type { IntelligenceReport, ResearchRow } from './report-types';
import { enrichReportDerived } from './report-derived';
import { emptyReport, mentionRate, platformFromModel, unique } from './report-utils';

type Legacy = {
  version?: number;
  brandName?: string;
  websiteUrl?: string;
  overall?: number;
  aeo?: number;
  geo?: number;
  llmReady?: number;
  grade?: string;
  summary?: string;
  confidence?: string;
  generatedAt?: string;
  analysisId?: string;
  research?: ResearchRow[];
  crawl?: IntelligenceReport['crawl'];
  llmEstimates?: { model: string; score: number; insight: string }[];
  recommendations?: { title: string; detail: string; priority: string }[];
  roadmap30Day?: string[];
  roadmap90Day?: string[];
  competitorInsights?: string;
  [key: string]: unknown;
};

function isV2(p: Legacy): p is Legacy & IntelligenceReport {
  return p.version === 2 && Array.isArray((p as IntelligenceReport).platformPerformance);
}

export function normalizeReport(
  raw: unknown,
  meta: {
    brandName: string;
    overall: number;
    aeo: number;
    geo: number;
    llmReady: number;
    summary: string;
    token: string;
    analysisId: string;
    generatedAt: string;
    pdfAvailable: boolean;
  },
): IntelligenceReport {
  let parsed: Legacy = {};
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as Legacy;
    } catch {
      parsed = {};
    }
  } else if (raw && typeof raw === 'object') {
    parsed = raw as Legacy;
  }

  if (isV2(parsed)) {
    return enrichReportDerived({
      ...parsed,
      analysisId: parsed.analysisId || meta.analysisId,
      brandName: parsed.brandName || meta.brandName,
      token: meta.token,
      pdfAvailable: meta.pdfAvailable,
      generatedAt: parsed.generatedAt || meta.generatedAt,
    });
  }

  const research = (parsed.research || []).map((r) => ({
    ...r,
    platform: r.platform || platformFromModel(r.model),
  }));
  const usable = research.filter((r) => r.answer && !r.error);
  const platforms = unique(usable.map((r) => r.platform || platformFromModel(r.model)));
  const models = unique(usable.map((r) => r.model));
  const queries = unique(usable.map((r) => r.question));
  const mRate = mentionRate(research);
  const mentions = usable.filter((r) => r.brandMentioned).length;

  const byModel = new Map<string, ResearchRow[]>();
  for (const r of usable) {
    const key = `${r.platform || platformFromModel(r.model)}:::${r.model}`;
    const list = byModel.get(key) || [];
    list.push(r);
    byModel.set(key, list);
  }

  const platformPerformance = [...byModel.entries()].map(([key, rows]) => {
    const [platform, model] = key.split(':::');
    const hit = rows.filter((r) => r.brandMentioned).length;
    const mentionPct = rows.length ? Math.round((hit / rows.length) * 1000) / 10 : null;
    return {
      platform,
      model: model.split('/').pop() || model,
      queries: unique(rows.map((x) => x.question)).length,
      mentions: hit,
      mentionRate: mentionPct,
      avgPosition: null as number | null,
      citations: 0,
      citationRate: null as number | null,
      visibility: mentionPct == null ? null : Math.min(100, Math.round(mentionPct * 0.85 + (rows.length >= 2 ? 8 : 0))),
    };
  });

  const ranked = [...platformPerformance].sort((a, b) => (b.visibility || 0) - (a.visibility || 0));
  const crawl = parsed.crawl || {
    title: '',
    description: '',
    wordCount: 0,
    hasFaq: false,
    hasSchema: false,
    headings: [],
  };

  const recs = parsed.recommendations || [];
  const conf = (parsed.confidence === 'High' || parsed.confidence === 'Medium' || parsed.confidence === 'Low'
    ? parsed.confidence
    : usable.length >= 4
      ? 'High'
      : usable.length >= 2
        ? 'Medium'
        : 'Low') as IntelligenceReport['confidence'];

  return enrichReportDerived({
    ...emptyReport({
      analysisId: meta.analysisId,
      brandName: parsed.brandName || meta.brandName,
      websiteUrl: parsed.websiteUrl || '',
    }),
    generatedAt: parsed.generatedAt || meta.generatedAt,
    overall: parsed.overall ?? meta.overall,
    aeo: parsed.aeo ?? meta.aeo,
    geo: parsed.geo ?? meta.geo,
    llmReady: parsed.llmReady ?? meta.llmReady,
    summary: parsed.summary || meta.summary,
    confidence: conf,
    confidenceReason: `${conf} confidence — ${usable.length} AI responses across ${platforms.length} AI platforms and ${queries.length} queries.`,
    scores: {
      buddyScore: parsed.overall ?? meta.overall,
      aiVisibility: parsed.llmReady ?? meta.llmReady,
      onSiteReadiness: null,
      aeo: parsed.aeo ?? meta.aeo,
      geo: parsed.geo ?? meta.geo,
      technical: null,
      entityStrength: null,
      citationStrength: null,
      brandConsistency: null,
      competitorAdvantage: null,
    },
    coverage: {
      platformsTested: platforms.length,
      modelsTested: models.length,
      queriesTransacted: queries.length,
      responsesAnalyzed: usable.length,
      brandsTracked: 1,
      citationsCollected: 0,
      researchStartedAt: parsed.generatedAt || meta.generatedAt,
      researchEndedAt: parsed.generatedAt || meta.generatedAt,
      platformNames: platforms,
      modelNames: models,
    },
    platformPerformance,
    strongestPlatform: ranked[0]
      ? {
          platform: ranked[0].platform,
          model: ranked[0].model,
          visibility: ranked[0].visibility,
          mentionRate: ranked[0].mentionRate,
          avgPosition: null,
          citationRate: null,
          evidence: `${ranked[0].platform} mentioned the brand in ${ranked[0].mentions}/${ranked[0].queries} sampled prompts.`,
          interpretation: ranked[0].visibility != null
            ? 'Relative strongest platform in this legacy sample. Citation and position detail were not stored in this report version.'
            : 'Insufficient data.',
        }
      : null,
    weakestPlatform:
      ranked.length > 1
        ? {
            platform: ranked[ranked.length - 1].platform,
            model: ranked[ranked.length - 1].model,
            visibility: ranked[ranked.length - 1].visibility,
            mentionRate: ranked[ranked.length - 1].mentionRate,
            avgPosition: null,
            citationRate: null,
            evidence: `${ranked[ranked.length - 1].platform} mentioned the brand in ${ranked[ranked.length - 1].mentions}/${ranked[ranked.length - 1].queries} sampled prompts.`,
            interpretation: 'Relative weakest platform in this legacy sample.',
          }
        : null,
    strengths:
      mRate != null && mRate > 0
        ? [
            {
              id: 'mentions',
              title: 'Brand appeared in sampled AI answers',
              metric: `${mRate}% mention rate`,
              evidence: `${mentions} of ${usable.length} successful responses named the brand.`,
              impact: 'There is a measurable path into AI recommendations.',
            },
          ]
        : [],
    gaps:
      usable.length && (mRate == null || mRate < 50)
        ? [
            {
              id: 'mention-gap',
              title: 'Incomplete brand presence in AI answers',
              metric: mRate == null ? 'N/A' : `${mRate}%`,
              evidence: `Named in ${mentions}/${usable.length} successful responses.`,
              impact: 'High',
              area: 'AI Visibility',
              severity: 'High',
            },
          ]
        : [],
    promptResults: groupPrompts(research),
    winningQueries: usable
      .filter((r) => r.brandMentioned)
      .slice(0, 8)
      .map((r) => ({
        query: r.question,
        platform: r.platform || platformFromModel(r.model),
        position: r.brandPosition ?? null,
        mentioned: true,
        cited: r.ownDomainCited ?? null,
        competitors: r.competitorsMentioned || [],
      })),
    losingQueries: usable
      .filter((r) => !r.brandMentioned)
      .slice(0, 8)
      .map((r) => ({
        query: r.question,
        platform: r.platform || platformFromModel(r.model),
        position: null,
        mentioned: false,
        cited: false,
        competitors: [],
        whoWon: 'N/A',
        why: 'Brand was not named in this sampled answer.',
        missing: 'Insufficient stored competitor fields in this report version.',
        opportunity: 'Re-run analysis to capture competitor and citation evidence.',
      })),
    howToDoBetter: recs.map((r) => ({
      problem: r.title,
      whyItMatters: r.detail,
      evidence: r.detail,
      recommendedAction: r.title,
      implementation: r.detail,
      priority: r.priority.toLowerCase() === 'high' ? 'High' : r.priority.toLowerCase() === 'low' ? 'Low' : 'Medium',
      difficulty: 'Medium',
      expectedImpact: 'Potential directional improvement. Not a guaranteed score change.',
    })),
    roadmap30: (parsed.roadmap30Day || []).length
      ? [{ week: 1, theme: 'Plan', tasks: (parsed.roadmap30Day || []).map((t) => ({ task: t, connectedProblem: 'Legacy roadmap' })) }]
      : [],
    strategy90: (parsed.roadmap90Day || []).length
      ? [{ month: 1, theme: 'Plan', tasks: parsed.roadmap90Day || [] }]
      : [],
    executiveSummary: {
      where: `${parsed.brandName || meta.brandName} AI Visibility ${parsed.overall ?? meta.overall}/100.`,
      visibility: usable.length
        ? `Mentioned in ${mentions}/${usable.length} successful responses (${mRate == null ? 'N/A' : `${mRate}%`}).`
        : 'No successful AI responses in this sample.',
      strengths: mRate != null && mRate > 0 ? ['Measurable brand mentions in the sample'] : [],
      gaps: mRate != null && mRate < 50 ? ['Incomplete mention coverage'] : [],
      next: recs.slice(0, 3).map((r) => r.title),
    },
    finalTakeaway: parsed.summary || meta.summary,
    competitorInsights: typeof parsed.competitorInsights === 'string' ? parsed.competitorInsights : '',
    methodologyNotes: [
      'This report was generated in an earlier BuddyAds format. Some citation, position, and competitor fields are N/A.',
      `${platforms.length} platforms, ${queries.length} queries, ${usable.length} responses in the stored sample.`,
    ],
    crawl,
    research,
    token: meta.token,
    pdfAvailable: meta.pdfAvailable,
  });
}

function groupPrompts(research: ResearchRow[]) {
  const map = new Map<string, ResearchRow[]>();
  for (const r of research) {
    const list = map.get(r.question) || [];
    list.push(r);
    map.set(r.question, list);
  }
  return [...map.entries()].map(([query, rows]) => ({
    query,
    platforms: rows.map((r) => ({
      platform: r.platform || platformFromModel(r.model),
      model: r.model.split('/').pop() || r.model,
      mentioned: r.error ? null : r.brandMentioned,
      position: r.brandPosition ?? null,
      competitors: r.competitorsMentioned || [],
      citations: (r.citations || []).map((c) => c.domain),
      source: r.citations?.[0]?.domain || null,
      error: r.error,
    })),
  }));
}
