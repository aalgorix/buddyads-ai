export const REPORT_VERSION = 2 as const;

export type Confidence = 'Low' | 'Medium' | 'High';
export type Priority = 'High' | 'Medium' | 'Low';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export type CitationRef = {
  url: string;
  domain: string;
};

export type ResearchRow = {
  model: string;
  platform: string;
  question: string;
  answer: string;
  brandMentioned: boolean;
  brandPosition: number | null;
  competitorsMentioned: string[];
  observedBrands: string[];
  citations: CitationRef[];
  ownDomainCited: boolean;
  sentiment: Sentiment | null;
  error?: string;
};

export type CrawlSnapshot = {
  title: string;
  description: string;
  wordCount: number;
  hasFaq: boolean;
  hasSchema: boolean;
  headings: string[];
  h1: string[];
  canonical: string | null;
  robotsMeta: string | null;
  robotsTxtFound: boolean | null;
  robotsAllowsIndexing: boolean | null;
  hasSitemap: boolean | null;
  ogTitle: string | null;
  ogDescription: string | null;
  imageCount: number;
  imagesWithAlt: number;
  schemaTypes: string[];
  hasProductSchema: boolean;
  hasOrgSchema: boolean;
  hasFaqSchema: boolean;
  hasPersonSchema: boolean;
  hasLocalBusiness: boolean;
  hasAbout: boolean;
  hasContact: boolean;
  hasComparison: boolean;
  hasAuthor: boolean;
  hasLocation: boolean;
  internalLinkCount: number;
  externalLinkCount: number;
  questionHeadings: number;
  host: string;
  linkCount: number;
};

export type Coverage = {
  platformsTested: number;
  modelsTested: number;
  queriesTransacted: number;
  responsesAnalyzed: number;
  brandsTracked: number;
  citationsCollected: number;
  researchStartedAt: string | null;
  researchEndedAt: string | null;
  platformNames: string[];
  modelNames: string[];
};

export type PlatformPerformance = {
  platform: string;
  model: string;
  queries: number;
  mentions: number;
  mentionRate: number | null;
  avgPosition: number | null;
  citations: number;
  citationRate: number | null;
  visibility: number | null;
};

export type PlatformSpotlight = {
  platform: string;
  model: string;
  visibility: number | null;
  mentionRate: number | null;
  avgPosition: number | null;
  citationRate: number | null;
  evidence: string;
  interpretation: string;
};

export type EvidenceItem = {
  id: string;
  title: string;
  metric: string;
  evidence: string;
  impact: string;
  area?: string;
  severity?: Priority;
};

export type MissingSignal = {
  signal: string;
  observed: string;
  whyItMatters: string;
  recommendation: string;
};

export type CompetitorRow = {
  name: string;
  mentions: number;
  mentionRate: number | null;
  citations: number;
  platforms: string[];
  favoredBy: string[];
};

export type ShareOfVoiceRow = {
  name: string;
  mentions: number;
  share: number | null;
  isBrand: boolean;
};

export type CoOccurrence = {
  brand: string;
  count: number;
};

export type CompetitorGapRow = {
  area: string;
  yours: string;
  competitor: string;
  competitorName: string;
  gap: string;
};

export type PromptPlatformCell = {
  platform: string;
  model: string;
  mentioned: boolean | null;
  position: number | null;
  competitors: string[];
  citations: string[];
  source: string | null;
  error?: string;
};

export type PromptResult = {
  query: string;
  platforms: PromptPlatformCell[];
};

export type QueryOutcome = {
  query: string;
  platform: string;
  position: number | null;
  mentioned: boolean | null;
  cited: boolean | null;
  competitors: string[];
  whoWon?: string;
  why?: string;
  missing?: string;
  opportunity?: string;
};

export type CitedDomain = {
  domain: string;
  frequency: number;
  platforms: string[];
  isOwn: boolean;
  isCompetitor: boolean;
};

export type CitationGapRow = {
  competitor: string;
  domains: string[];
  yours: string[];
  opportunity: string;
};

export type SubScore = {
  label: string;
  score: number | null;
  note: string;
};

export type EntityProfile = {
  company: string;
  products: string | null;
  services: string | null;
  industry: string | null;
  locations: string | null;
  audience: string | null;
  topics: string[];
  competitors: string[];
  technology: string | null;
  missing: string[];
  inconsistent: string[];
};

export type Perception = {
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
  observedQuotes: { text: string; platform: string; sentiment: Sentiment }[];
  interpretation: string;
};

export type Opportunity = {
  rank: number;
  title: string;
  impact: Priority;
  difficulty: Difficulty;
  confidence: Confidence;
  platforms: string[];
  evidence: string;
  strategicValue: string;
};

export type HowToItem = {
  problem: string;
  whyItMatters: string;
  evidence: string;
  recommendedAction: string;
  implementation: string;
  priority: Priority;
  difficulty: Difficulty;
  expectedImpact: string;
};

export type DayPlan = {
  day: number;
  title: string;
  task: string;
  connectedProblem: string;
};

export type WeekPlan = {
  week: number;
  theme: string;
  tasks: { task: string; connectedProblem: string }[];
};

export type MonthPlan = {
  month: number;
  theme: string;
  tasks: string[];
};

export type ExecutiveSummary = {
  where: string;
  visibility: string;
  strengths: string[];
  gaps: string[];
  next: string[];
};

export type BrandCategoryTier =
  | 'Category leader'
  | 'Known alternative'
  | 'Occasional mention'
  | 'Low visibility'
  | 'Invisible';

export type BrandCategory = {
  tier: BrandCategoryTier;
  summary: string;
};

export type MentionBreakdown = {
  mentionedNoLink: number;
  mentionedWithLink: number;
  noMention: number;
  totalResponses: number;
  mentionedNoLinkRate: number | null;
  mentionedWithLinkRate: number | null;
  noMentionRate: number | null;
};

export type LlmStrategyBrief = {
  platform: string;
  tag: string;
  note: string;
};

export type Scorecard = {
  buddyScore: number | null;
  aiVisibility: number | null;
  aeo: number | null;
  geo: number | null;
  technical: number | null;
  entityStrength: number | null;
  citationStrength: number | null;
  brandConsistency: number | null;
  competitorAdvantage: number | null;
};

export type ReportPayload = {
  version: typeof REPORT_VERSION;
  analysisId: string;
  brandName: string;
  websiteUrl: string;
  generatedAt: string;
  overall: number;
  aeo: number;
  geo: number;
  llmReady: number;
  grade: string;
  summary: string;
  confidence: Confidence;
  confidenceReason: string;
  scores: Scorecard;
  coverage: Coverage;
  platformPerformance: PlatformPerformance[];
  strongestPlatform: PlatformSpotlight | null;
  weakestPlatform: PlatformSpotlight | null;
  strengths: EvidenceItem[];
  gaps: EvidenceItem[];
  missingSignals: MissingSignal[];
  competitors: CompetitorRow[];
  shareOfVoice: ShareOfVoiceRow[];
  coOccurrence: CoOccurrence[];
  competitorGaps: CompetitorGapRow[];
  promptResults: PromptResult[];
  winningQueries: QueryOutcome[];
  losingQueries: QueryOutcome[];
  citedDomains: CitedDomain[];
  ownCitationRate: number | null;
  citationGaps: CitationGapRow[];
  aeoDetail: SubScore[];
  geoDetail: SubScore[];
  technicalDetail: SubScore[];
  entityProfile: EntityProfile;
  perception: Perception | null;
  opportunities: Opportunity[];
  howToDoBetter: HowToItem[];
  plan7Day: DayPlan[];
  roadmap30: WeekPlan[];
  strategy90: MonthPlan[];
  executiveSummary: ExecutiveSummary;
  brandCategory: BrandCategory;
  mentionBreakdown: MentionBreakdown;
  llmStrategies: LlmStrategyBrief[];
  finalTakeaway: string;
  methodologyNotes: string[];
  crawl: CrawlSnapshot;
  research: ResearchRow[];
  /** Legacy-compatible fields for older email/PDF callers */
  recommendations: {
    title: string;
    detail: string;
    priority: string;
    category?: string;
    reason?: string;
    businessImpact?: string;
    difficulty?: string;
    estimatedTime?: string;
    expectedGain?: string;
  }[];
  llmEstimates: { model: string; score: number; insight: string }[];
  roadmap30Day: string[];
  roadmap90Day: string[];
  competitorInsights: string;
};
