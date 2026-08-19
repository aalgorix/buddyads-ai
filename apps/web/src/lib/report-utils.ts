import type { Confidence, IntelligenceReport, ResearchRow } from './report-types';

export function na(v: number | string | null | undefined): string {
  if (v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))) return 'N/A';
  return String(v);
}

export function pct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return 'N/A';
  return `${v}%`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function platformFromModel(model: string): string {
  const m = (model || '').toLowerCase();
  if (m.includes('perplexity')) return 'Perplexity';
  if (m.includes('gemini') || m.startsWith('google/')) return 'Gemini';
  if (m.includes('claude') || m.startsWith('anthropic/')) return 'Claude';
  if (m.includes('grok') || m.startsWith('x-ai/') || m.startsWith('xai/')) return 'Grok';
  if (m.includes('copilot')) return 'Copilot';
  if (m.includes('openai') || m.includes('gpt')) return 'ChatGPT';
  return model.split('/')[0] || model || 'Unknown';
}

export function unique(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of list) {
    const t = x.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}

export function mentionRate(research: ResearchRow[]): number | null {
  const usable = research.filter((r) => r.answer && !r.error);
  if (!usable.length) return null;
  const hits = usable.filter((r) => r.brandMentioned).length;
  return Math.round((hits / usable.length) * 1000) / 10;
}

export function scoreTone(n: number | null | undefined): 'high' | 'mid' | 'low' | 'na' {
  if (n == null) return 'na';
  if (n >= 72) return 'high';
  if (n >= 48) return 'mid';
  return 'low';
}

export function confidenceCopy(level: Confidence): string {
  if (level === 'High') return 'Sample is broad enough for executive decisions, still a snapshot not a census.';
  if (level === 'Medium') return 'Directionally useful. Treat fine-grained comparisons as indicative.';
  return 'Limited sample. Do not over-read small differences between platforms.';
}

export const TOC = [
  { id: 'cover', n: '01', label: 'Cover' },
  { id: 'how-to-read', n: '02', label: 'How to Read' },
  { id: 'executive-summary', n: '03', label: 'Executive Summary' },
  { id: 'brand-category', n: '04', label: 'Brand Category' },
  { id: 'doing-well-bad', n: '05', label: 'Well / Bad / Missing' },
  { id: 'llm-performance', n: '06', label: 'LLM Performance' },
  { id: 'mention-breakdown', n: '07', label: 'Mention vs Link' },
  { id: 'competition', n: '08', label: 'Competition' },
  { id: 'how-to-better', n: '09', label: 'Do It Better' },
  { id: 'llm-strategy', n: '10', label: 'Strategy by LLM' },
] as const;

export function emptyReport(partial: Partial<IntelligenceReport> & Pick<IntelligenceReport, 'brandName' | 'websiteUrl' | 'analysisId'>): IntelligenceReport {
  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    overall: 0,
    aeo: 0,
    geo: 0,
    llmReady: 0,
    summary: '',
    confidence: 'Low',
    confidenceReason: 'Insufficient data.',
    onSiteConfidence: 'Low',
    onSiteConfidenceReason: 'No crawl text was captured.',
    scores: {
      buddyScore: null,
      aiVisibility: null,
      onSiteReadiness: null,
      aeo: null,
      geo: null,
      technical: null,
      entityStrength: null,
      citationStrength: null,
      brandConsistency: null,
      competitorAdvantage: null,
    },
    coverage: {
      platformsTested: 0,
      modelsTested: 0,
      queriesTransacted: 0,
      responsesAnalyzed: 0,
      brandsTracked: 0,
      citationsCollected: 0,
      researchStartedAt: null,
      researchEndedAt: null,
      platformNames: [],
      modelNames: [],
      platformsQueried: 0,
      platformsUsable: 0,
      platformNamesQueried: [],
      platformNamesUsable: [],
      competitorsTracked: 0,
      limitedSample: true,
      platformStatus: [],
      sampleSize: 0,
      sampleCaveat: 'Directional only — based on a limited sample.',
    },
    platformPerformance: [],
    strongestPlatform: null,
    weakestPlatform: null,
    strengths: [],
    gaps: [],
    missingSignals: [],
    competitors: [],
    shareOfVoice: [],
    coOccurrence: [],
    competitorGaps: [],
    closestCompetitors: [],
    promptResults: [],
    winningQueries: [],
    losingQueries: [],
    citedDomains: [],
    ownCitationRate: null,
    citationGaps: [],
    aeoDetail: [],
    geoDetail: [],
    technicalDetail: [],
    entityProfile: {
      company: partial.brandName,
      products: null,
      services: null,
      industry: null,
      locations: null,
      audience: null,
      topics: [],
      competitors: [],
      technology: null,
      missing: [],
      inconsistent: [],
    },
    perception: null,
    opportunities: [],
    howToDoBetter: [],
    plan7Day: [],
    roadmap30: [],
    strategy90: [],
    executiveSummary: { where: '', visibility: '', strengths: [], gaps: [], next: [] },
    brandCategory: { tier: 'Low visibility', summary: '' },
    mentionBreakdown: {
      mentionedNoLink: 0,
      mentionedWithLink: 0,
      noMention: 0,
      totalResponses: 0,
      mentionedNoLinkRate: null,
      mentionedWithLinkRate: null,
      noMentionRate: null,
    },
    llmStrategies: [],
    finalTakeaway: '',
    methodologyNotes: [],
    competitorInsights: '',
    methodologyVersion: '',
    categoryBenchmark: {
      available: false,
      note: 'No benchmark available for this category',
      typicalMentionRate: null,
      strongMentionRate: null,
    },
    oneThingCallout: null,
    crawl: {
      title: '',
      description: '',
      wordCount: 0,
      hasFaq: false,
      hasSchema: false,
      headings: [],
    },
    research: [],
    ...partial,
  };
}
