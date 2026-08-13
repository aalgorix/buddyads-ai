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
  { id: 'executive-summary', n: '02', label: 'Executive Summary' },
  { id: 'how-to-read', n: '03', label: 'How to Read' },
  { id: 'coverage', n: '04', label: 'Research Coverage' },
  { id: 'overview', n: '05', label: 'Visibility Overview' },
  { id: 'platforms', n: '06', label: 'LLM Performance' },
  { id: 'best-worst', n: '07', label: 'Best & Worst AI' },
  { id: 'strengths', n: '08', label: 'What You Do Well' },
  { id: 'gaps', n: '09', label: 'Visibility Gaps' },
  { id: 'missing', n: '10', label: 'What AI Cannot Find' },
  { id: 'competition', n: '11', label: 'Competition' },
  { id: 'competitor-gaps', n: '12', label: 'Competitor Gaps' },
  { id: 'prompts', n: '13', label: 'Prompt-Level Results' },
  { id: 'winning', n: '14', label: 'Winning Queries' },
  { id: 'losing', n: '15', label: 'Losing Queries' },
  { id: 'citations', n: '16', label: 'Citation Intelligence' },
  { id: 'citation-gap', n: '17', label: 'Citation Gap' },
  { id: 'aeo', n: '18', label: 'AEO' },
  { id: 'geo', n: '19', label: 'GEO' },
  { id: 'technical', n: '20', label: 'Technical Readiness' },
  { id: 'entity', n: '21', label: 'AI Entity Profile' },
  { id: 'perception', n: '22', label: 'AI Perception' },
  { id: 'opportunities', n: '23', label: 'Biggest Opportunities' },
  { id: 'how-to', n: '24', label: 'How to Do It Better' },
  { id: 'plan-7', n: '25', label: '7-Day Plan' },
  { id: 'plan-30', n: '26', label: '30-Day Roadmap' },
  { id: 'plan-90', n: '27', label: '90-Day Strategy' },
  { id: 'methodology', n: '28', label: 'Methodology' },
  { id: 'confidence', n: '29', label: 'Data Quality' },
  { id: 'takeaway', n: '30', label: 'Executive Takeaway' },
] as const;

export function emptyReport(partial: Partial<IntelligenceReport> & Pick<IntelligenceReport, 'brandName' | 'websiteUrl' | 'analysisId'>): IntelligenceReport {
  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    overall: 0,
    aeo: 0,
    geo: 0,
    llmReady: 0,
    grade: '—',
    summary: '',
    confidence: 'Low',
    confidenceReason: 'Insufficient data.',
    scores: {
      buddyScore: null,
      aiVisibility: null,
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
    finalTakeaway: '',
    methodologyNotes: [],
    competitorInsights: '',
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
