export type Provenance = 'OBSERVED' | 'ESTIMATED';

export type ScoreComponent = {
  key: string;
  label: string;
  raw: number | null;
  rawDisplay: string;
  normalized: number | null;
  weight: number;
  contribution: number;
  provenance: Provenance;
  sourceRef: string;
  excluded: boolean;
  excludeReason?: string;
};

export type ScoreBreakdown = {
  total: number;
  missingPolicy: 'excluded_and_weights_renormalized';
  missingPolicyNote: string;
  components: ScoreComponent[];
  label?: string;
  scope?: 'aiVisibility' | 'onSite' | 'legacyBuddyScore';
};

export type DisplayedMetric = {
  key: string;
  label: string;
  value: number | string;
  provenance: Provenance;
  sourceRef: string;
};

export type PdfReport = {
  brandName: string;
  websiteUrl: string;
  analysisId: string;
  generatedAt: string;
  overall: number;
  summary: string;
  confidence: string;
  confidenceReason?: string;
  onSiteConfidence?: string;
  onSiteConfidenceReason?: string;
  scores?: {
    buddyScore?: number | null;
    aiVisibility?: number | null;
    onSiteReadiness?: number | null;
  };
  coverage?: {
    platformsTested?: number;
    platformsQueried?: number;
    platformsUsable?: number;
    queriesTransacted?: number;
    responsesAnalyzed?: number;
    competitorsTracked?: number;
    limitedSample?: boolean;
    sampleSize?: number;
    sampleCaveat?: string | null;
    platformNames?: string[];
    platformStatus?: { platform: string; usable: number; note: string }[];
  };
  ownCitationRate?: number | null;
  research?: { brandMentioned?: boolean; answer?: string; error?: string }[];
  strongestPlatform?: {
    platform?: string;
    visibility?: number | null;
    mentionRate?: number | null;
    avgPosition?: number | null;
    evidence?: string;
  } | null;
  weakestPlatform?: {
    platform?: string;
    visibility?: number | null;
    mentionRate?: number | null;
    avgPosition?: number | null;
    evidence?: string;
  } | null;
  executiveSummary?: { where?: string; visibility?: string; next?: string[]; oneThing?: { problem: string; action: string; sourceRef: string } | null };
  brandCategory?: { tier?: string; summary?: string };
  strengths?: { title: string; metric: string; evidence: string; impact: string }[];
  gaps?: { title: string; metric: string; evidence: string; impact?: string }[];
  missingSignals?: { signal: string; observed: string; whyItMatters: string; recommendation: string }[];
  platformPerformance?: {
    platform: string;
    queries: number;
    mentions: number;
    mentionRate: number | null;
    avgPosition: number | null;
    citations: number;
    visibility: number | null;
  }[];
  mentionBreakdown?: {
    mentionedNoLink?: number;
    mentionedWithLink?: number;
    noMention?: number;
    mentionedNoLinkRate?: number | null;
    mentionedWithLinkRate?: number | null;
    noMentionRate?: number | null;
  };
  winningQueries?: { query: string; platform: string; position?: number | null; why?: string; opportunity?: string }[];
  losingQueries?: { query: string; platform: string; why?: string; missing?: string }[];
  closestCompetitors?: {
    rank: number;
    name: string;
    mentionRate: number | null;
    mentions: number;
    theyWinOn: string;
    moves: string[];
  }[];
  competitorInsights?: string;
  shareOfVoice?: { name: string; mentions: number; share: number | null; isBrand: boolean }[];
  competitorGaps?: { area: string; competitorName: string; competitor: string; gap: string }[];
  howToDoBetter?: {
    problem: string;
    whyItMatters: string;
    recommendedAction: string;
    effort?: string;
    ownerType?: string;
    timeToImpact?: string;
  }[];
  finalTakeaway?: string;
  llmStrategies?: { platform: string; tag: string; note: string }[];
  competitors?: { name: string }[];
  scoreBreakdown?: ScoreBreakdown;
  aiVisibilityBreakdown?: ScoreBreakdown;
  onSiteBreakdown?: ScoreBreakdown;
  displayedMetrics?: DisplayedMetric[];
  methodologyVersion?: string;
  categoryBenchmark?: {
    available: boolean;
    note: string;
    typicalMentionRate: number | null;
    strongMentionRate: number | null;
  };
  oneThingCallout?: { problem: string; action: string; sourceRef: string } | null;
};
