import type { CrawlResult } from './crawl';
import type { LlmAnswer } from './llm';
import {
  brandPosition,
  detectMention,
  domainOfUrl,
  extractCitations,
  extractObservedBrands,
  inferSentiment,
  mentionedOf,
  ownDomainCited,
  parseNameList,
  uniqueNames,
} from './extract';
import { platformFromModel, shortModelName } from './platforms';
import type {
  CitedDomain,
  CitationGapRow,
  CoOccurrence,
  CompetitorGapRow,
  CompetitorRow,
  Confidence,
  Coverage,
  CrawlSnapshot,
  DayPlan,
  EntityProfile,
  EvidenceItem,
  HowToItem,
  MissingSignal,
  MonthPlan,
  Opportunity,
  Perception,
  PlatformPerformance,
  PlatformSpotlight,
  PromptResult,
  QueryOutcome,
  ReportPayload,
  ResearchRow,
  Scorecard,
  ShareOfVoiceRow,
  SubScore,
  WeekPlan,
} from '../types/report';
import { REPORT_VERSION } from '../types/report';

export type IntakeContext = {
  companyName?: string | null;
  businessDescription?: string | null;
  productsServices?: string | null;
  idealCustomers?: string | null;
  countries?: string | null;
  competitors?: string | null;
  marketingChallenge?: string | null;
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function gradeOf(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function rate(num: number, den: number): number | null {
  if (!den) return null;
  return Math.round((num / den) * 1000) / 10;
}

function fmtPct(n: number | null): string {
  return n == null ? 'N/A' : `${n}%`;
}

function fmtNum(n: number | null): string {
  return n == null ? 'N/A' : String(n);
}

function boolScore(on: boolean, yes: number, no = 0): number {
  return on ? yes : no;
}

function snapshotCrawl(crawl: CrawlResult | null): CrawlSnapshot {
  return {
    title: crawl?.title || '',
    description: crawl?.description || '',
    wordCount: crawl?.wordCount || 0,
    hasFaq: crawl?.hasFaq || false,
    hasSchema: crawl?.hasSchema || false,
    headings: crawl?.headings || [],
    h1: crawl?.h1 || [],
    canonical: crawl?.canonical || null,
    robotsMeta: crawl?.robotsMeta || null,
    robotsTxtFound: crawl?.robotsTxtFound ?? null,
    robotsAllowsIndexing: crawl?.robotsAllowsIndexing ?? null,
    hasSitemap: crawl?.hasSitemap ?? null,
    ogTitle: crawl?.ogTitle || null,
    ogDescription: crawl?.ogDescription || null,
    imageCount: crawl?.imageCount || 0,
    imagesWithAlt: crawl?.imagesWithAlt || 0,
    schemaTypes: crawl?.schemaTypes || [],
    hasProductSchema: crawl?.hasProductSchema || false,
    hasOrgSchema: crawl?.hasOrgSchema || false,
    hasFaqSchema: crawl?.hasFaqSchema || false,
    hasPersonSchema: crawl?.hasPersonSchema || false,
    hasLocalBusiness: crawl?.hasLocalBusiness || false,
    hasAbout: crawl?.hasAbout || false,
    hasContact: crawl?.hasContact || false,
    hasComparison: crawl?.hasComparison || false,
    hasAuthor: crawl?.hasAuthor || false,
    hasLocation: crawl?.hasLocation || false,
    internalLinkCount: crawl?.internalLinkCount || 0,
    externalLinkCount: crawl?.externalLinkCount || 0,
    questionHeadings: crawl?.questionHeadings || 0,
    host: crawl?.host || '',
    linkCount: crawl?.linkCount || 0,
  };
}

export function enrichResearch(
  research: LlmAnswer[],
  brand: string,
  websiteUrl: string,
  knownCompetitors: string[],
): ResearchRow[] {
  return research.map((r) => {
    const answer = r.answer || '';
    const citations = extractCitations(answer);
    const observed = extractObservedBrands(answer, brand, knownCompetitors);
    const allOthers = uniqueNames([...knownCompetitors, ...observed]);
    return {
      model: r.model,
      platform: r.platform || platformFromModel(r.model),
      question: r.question,
      answer,
      brandMentioned: r.error ? false : detectMention(answer, brand),
      brandPosition: r.error ? null : brandPosition(answer, brand, allOthers),
      competitorsMentioned: r.error ? [] : mentionedOf(answer, knownCompetitors, brand),
      observedBrands: r.error ? [] : observed,
      citations,
      ownDomainCited: r.error ? false : ownDomainCited(citations, websiteUrl),
      sentiment: r.error ? null : inferSentiment(answer, brand),
      error: r.error,
    };
  });
}

function aeoBreakdown(c: CrawlSnapshot): SubScore[] {
  const faq = c.hasFaqSchema ? 92 : c.hasFaq ? 72 : 28;
  const questions = clamp(c.questionHeadings * 18 + (c.hasFaq ? 20 : 0) + 18);
  const extract = clamp(
    (c.headings.length >= 4 ? 30 : c.headings.length * 6) +
      (c.wordCount > 400 ? 28 : c.wordCount > 150 ? 14 : 6) +
      (c.description.length > 40 ? 18 : 8) +
      12,
  );
  const direct = clamp((c.description.length > 80 ? 24 : 10) + (c.h1.length === 1 ? 22 : 8) + (c.hasFaq ? 20 : 0) + 16);
  const voice = clamp((c.hasFaq ? 30 : 8) + (c.questionHeadings >= 3 ? 28 : c.questionHeadings * 8) + 18);
  const featured = clamp((c.hasFaqSchema ? 24 : 0) + (c.questionHeadings >= 2 ? 20 : 0) + (extract > 60 ? 18 : 8) + 16);
  return [
    { label: 'Question Coverage', score: questions, note: `${c.questionHeadings} question-style headings observed on the crawled page.` },
    { label: 'FAQ Readiness', score: faq, note: c.hasFaqSchema ? 'FAQPage schema present.' : c.hasFaq ? 'FAQ language detected, without FAQPage schema.' : 'No FAQ block or FAQPage schema detected.' },
    { label: 'Direct Answer Readiness', score: direct, note: 'Based on meta description, H1 clarity, and Q&A blocks.' },
    { label: 'Voice Search Readiness', score: voice, note: 'Conversational Q&A and question headings that assistants can speak back.' },
    { label: 'Content Extractability', score: extract, note: `${c.wordCount} words and ${c.headings.length} H1/H2 headings on the crawled page.` },
    { label: 'Featured Answer Readiness', score: featured, note: 'Likelihood that a passage can be lifted as a self-contained answer.' },
  ];
}

function geoBreakdown(c: CrawlSnapshot, brand: string): SubScore[] {
  const brandInTitle = brand ? c.title.toLowerCase().includes(brand.toLowerCase().split(' ')[0] || brand) : false;
  const entity = clamp(
    boolScore(c.hasOrgSchema, 28, 8) +
      boolScore(c.hasSchema, 14) +
      boolScore(c.hasAbout, 16) +
      boolScore(brandInTitle, 14, 4) +
      boolScore(c.hasPersonSchema, 10) +
      12,
  );
  const topic = clamp((c.wordCount > 800 ? 32 : c.wordCount > 400 ? 22 : 10) + Math.min(24, c.headings.length * 3) + 18);
  const semantic = clamp((c.h1.length === 1 ? 28 : c.h1.length > 1 ? 14 : 6) + (c.headings.length >= 5 ? 22 : 10) + 20);
  const kg = clamp(boolScore(c.hasOrgSchema, 30) + boolScore(c.hasProductSchema, 22) + boolScore(c.hasLocalBusiness, 14) + boolScore(c.schemaTypes.length > 0, 12) + 10);
  const consistency = clamp(boolScore(brandInTitle, 34, 12) + boolScore(Boolean(c.ogTitle), 18) + boolScore(c.hasAbout, 16) + 16);
  const completeness = clamp(
    boolScore(c.description.length > 40, 16) +
      boolScore(c.hasAbout, 14) +
      boolScore(c.hasContact, 10) +
      boolScore(c.hasProductSchema || Boolean(c.headings.length), 14) +
      (c.wordCount > 400 ? 16 : 6) +
      12,
  );
  const citeReady = clamp(boolScore(c.hasSchema, 16) + boolScore(c.externalLinkCount > 3, 12) + (c.wordCount > 500 ? 18 : 8) + boolScore(c.hasAuthor, 14) + 20);
  return [
    { label: 'Entity Strength', score: entity, note: c.hasOrgSchema ? 'Organization schema present.' : 'Limited machine-readable entity markup.' },
    { label: 'Topic Authority', score: topic, note: `On-page substance: ${c.wordCount} words across ${c.headings.length} headings.` },
    { label: 'Semantic Structure', score: semantic, note: `${c.h1.length} H1 and ${c.headings.length} primary headings.` },
    { label: 'Knowledge Graph Signals', score: kg, note: c.schemaTypes.length ? `Schema types: ${c.schemaTypes.slice(0, 6).join(', ')}.` : 'No JSON-LD types detected.' },
    { label: 'Content Consistency', score: consistency, note: brandInTitle ? 'Brand name appears in the page title.' : 'Brand name is weak or absent in the title.' },
    { label: 'AI Context Completeness', score: completeness, note: 'About, contact, description, and product/service cues combined.' },
    { label: 'Citation Readiness', score: citeReady, note: 'Proof, authorship, and structured facts models can quote.' },
  ];
}

function technicalBreakdown(c: CrawlSnapshot): SubScore[] {
  const altRate = c.imageCount ? Math.round((c.imagesWithAlt / c.imageCount) * 100) : null;
  const schema = c.hasSchema ? (c.schemaTypes.length >= 2 ? 88 : 70) : 24;
  const meta = clamp((c.description.length > 40 ? 40 : 12) + (c.ogTitle ? 24 : 8) + (c.ogDescription ? 16 : 4) + 10);
  const linking = clamp(Math.min(70, c.internalLinkCount * 2) + (c.internalLinkCount > 8 ? 18 : 8));
  const headings = clamp((c.h1.length === 1 ? 48 : c.h1.length === 0 ? 12 : 28) + Math.min(30, c.headings.length * 3) + 10);
  const images = altRate == null ? 40 : clamp(altRate * 0.7 + 18);
  const robots =
    c.robotsAllowsIndexing === false ? 18 : c.robotsTxtFound === true ? 82 : c.robotsTxtFound === false ? 42 : 50;
  const sitemap = c.hasSitemap === true ? 88 : c.hasSitemap === false ? 28 : 50;
  const canonical = c.canonical ? 86 : 32;
  const structured = clamp(boolScore(c.hasSchema, 40) + boolScore(c.hasOrgSchema, 18) + boolScore(c.hasProductSchema, 16) + 12);
  return [
    { label: 'Schema', score: schema, note: c.hasSchema ? 'Structured data detected.' : 'No JSON-LD / microdata detected on the crawled page.' },
    { label: 'Metadata', score: meta, note: c.description ? 'Meta description present.' : 'Meta description missing.' },
    { label: 'Internal Linking', score: linking, note: `${c.internalLinkCount} internal links counted.` },
    { label: 'Headings', score: headings, note: `${c.h1.length} H1 · ${c.headings.length} H1/H2.` },
    { label: 'Images', score: images, note: altRate == null ? 'No images counted.' : `${c.imagesWithAlt}/${c.imageCount} images have alt text.` },
    { label: 'Robots', score: robots, note: c.robotsAllowsIndexing === false ? 'noindex detected.' : c.robotsTxtFound === true ? 'robots.txt found.' : c.robotsTxtFound === false ? 'robots.txt not found.' : 'robots.txt probe inconclusive.' },
    { label: 'Sitemap', score: sitemap, note: c.hasSitemap === true ? 'sitemap.xml found.' : c.hasSitemap === false ? 'sitemap.xml not found.' : 'Sitemap probe inconclusive.' },
    { label: 'Canonical', score: canonical, note: c.canonical ? 'Canonical URL present.' : 'No canonical tag observed.' },
    { label: 'Structured Data', score: structured, note: c.schemaTypes.length ? c.schemaTypes.slice(0, 8).join(', ') : 'None detected.' },
  ];
}

function meanScore(rows: SubScore[]): number | null {
  const nums = rows.map((r) => r.score).filter((n): n is number => n != null);
  if (!nums.length) return null;
  return clamp(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function confidenceOf(usable: number, platforms: number, queries: number): { level: Confidence; reason: string } {
  if (usable >= 16 && platforms >= 3 && queries >= 6) {
    return {
      level: 'High',
      reason: `High confidence — ${usable} AI responses across ${platforms} AI platforms and ${queries} queries.`,
    };
  }
  if (usable >= 6 && platforms >= 2) {
    return {
      level: 'Medium',
      reason: `Medium confidence — ${usable} AI responses across ${platforms} AI platform${platforms === 1 ? '' : 's'} and ${queries} quer${queries === 1 ? 'y' : 'ies'}. Sample is usable, not exhaustive.`,
    };
  }
  return {
    level: 'Low',
    reason: `Low confidence — ${usable} successful AI response${usable === 1 ? '' : 's'} across ${platforms} platform${platforms === 1 ? '' : 's'} and ${queries} quer${queries === 1 ? 'y' : 'ies'}. Treat LLM metrics as directional.`,
  };
}

export function buildIntelligence(params: {
  analysisId: string;
  brandName: string;
  websiteUrl: string;
  crawl: CrawlResult | null;
  research: LlmAnswer[];
  intake?: IntakeContext | null;
  agentNotes?: string;
  generatedAt?: string;
  engineScores?: { aeo?: number; geo?: number; technical?: number } | null;
}): Omit<ReportPayload, 'executiveSummary' | 'finalTakeaway' | 'strongestPlatform' | 'weakestPlatform' | 'howToDoBetter' | 'plan7Day' | 'roadmap30' | 'strategy90' | 'opportunities' | 'recommendations' | 'llmEstimates' | 'roadmap30Day' | 'roadmap90Day' | 'competitorInsights' | 'summary' | 'brandCategory' | 'mentionBreakdown' | 'llmStrategies'> & {
  usableCount: number;
  mentionCount: number;
  citationCount: number;
  rawStrongest: PlatformPerformance | null;
  rawWeakest: PlatformPerformance | null;
} {
  const generatedAt = params.generatedAt || new Date().toISOString();
  const brand = params.brandName;
  const knownCompetitors = parseNameList(params.intake?.competitors);
  const crawl = snapshotCrawl(params.crawl);
  const research = enrichResearch(params.research, brand, params.websiteUrl, knownCompetitors);
  const usable = research.filter((r) => r.answer && !r.error);
  const mentionRows = usable.filter((r) => r.brandMentioned);
  const citeRows = usable.filter((r) => r.ownDomainCited);
  const mentionRate = rate(mentionRows.length, usable.length);
  const citationRate = rate(citeRows.length, usable.length);
  const positions = mentionRows.map((r) => r.brandPosition).filter((n): n is number => n != null);
  const avgPos = avg(positions);

  const platformNames = uniqueNames(research.map((r) => r.platform));
  const modelNames = uniqueNames(research.map((r) => r.model));
  const queries = uniqueNames(research.map((r) => r.question));
  const observedBrands = uniqueNames(usable.flatMap((r) => [...r.competitorsMentioned, ...r.observedBrands]));
  const trackedBrands = uniqueNames([brand, ...knownCompetitors, ...observedBrands]);
  const allCitations = usable.flatMap((r) => r.citations);

  const coverage: Coverage = {
    platformsTested: platformNames.length,
    modelsTested: modelNames.length,
    queriesTransacted: queries.length,
    responsesAnalyzed: usable.length,
    brandsTracked: trackedBrands.length,
    citationsCollected: allCitations.length,
    researchStartedAt: generatedAt,
    researchEndedAt: generatedAt,
    platformNames,
    modelNames,
  };

  const conf = confidenceOf(usable.length, platformNames.length, queries.length);

  const byModel = new Map<string, ResearchRow[]>();
  for (const r of usable) {
    const key = `${r.platform}:::${r.model}`;
    const list = byModel.get(key) || [];
    list.push(r);
    byModel.set(key, list);
  }

  const platformPerformance: PlatformPerformance[] = [...byModel.entries()].map(([key, rows]) => {
    const [platform, model] = key.split(':::');
    const mentions = rows.filter((r) => r.brandMentioned).length;
    const cites = rows.filter((r) => r.ownDomainCited).length;
    const mRate = rate(mentions, rows.length);
    const cRate = rate(cites, rows.length);
    const pos = avg(rows.map((r) => r.brandPosition).filter((n): n is number => n != null));
    const visibility =
      mRate == null
        ? null
        : clamp(mRate * 0.62 + (cRate || 0) * 0.22 + (pos != null ? Math.max(0, 18 - pos * 3) : 0) + (rows.length >= 2 ? 6 : 0));
    return {
      platform,
      model: shortModelName(model),
      queries: uniqueNames(rows.map((r) => r.question)).length,
      mentions,
      mentionRate: mRate,
      avgPosition: pos,
      citations: cites,
      citationRate: cRate,
      visibility,
    };
  });

  const ranked = platformPerformance
    .filter((p) => p.visibility != null)
    .sort((a, b) => (b.visibility || 0) - (a.visibility || 0));
  const rawStrongest = ranked[0] || null;
  const rawWeakest = ranked.length > 1 ? ranked[ranked.length - 1] : null;

  const aeoDetail = aeoBreakdown(crawl);
  const geoDetail = geoBreakdown(crawl, brand);
  const technicalDetail = technicalBreakdown(crawl);
  const aeo = params.engineScores?.aeo ?? meanScore(aeoDetail);
  const geo = params.engineScores?.geo ?? meanScore(geoDetail);
  const technical = params.engineScores?.technical ?? meanScore(technicalDetail);
  const entityStrength = geoDetail.find((s) => s.label === 'Entity Strength')?.score ?? null;
  const citationStrength =
    usable.length === 0 ? null : clamp((citationRate || 0) * 0.7 + (allCitations.length > 0 ? 18 : 4) + (crawl.hasAuthor ? 8 : 0));
  const brandToken = brand.toLowerCase().split(/\s+/)[0] || brand;
  const brandConsistency = clamp(
    (crawl.title.toLowerCase().includes(brandToken.toLowerCase()) ? 36 : 10) +
      (crawl.h1.some((h) => h.toLowerCase().includes(brandToken.toLowerCase())) ? 22 : 8) +
      (crawl.hasOrgSchema ? 18 : 6) +
      (mentionRate != null ? Math.min(24, mentionRate * 0.24) : 8),
  );

  const competitorMentions = usable.filter((r) => r.competitorsMentioned.length > 0 || r.observedBrands.length > 0).length;
  const competitorAdvantage =
    usable.length === 0
      ? null
      : clamp(50 + (mentionRate || 0) * 0.4 - rate(competitorMentions, usable.length)! * 0.35);

  const aiVisibility =
    usable.length === 0
      ? null
      : clamp((mentionRate || 0) * 0.7 + (citationRate || 0) * 0.18 + (avgPos != null ? Math.max(0, 14 - avgPos * 2) : 0) + (usable.length >= 4 ? 6 : 0));

  const buddyScore =
    aiVisibility == null
      ? clamp((aeo || 0) * 0.35 + (geo || 0) * 0.3 + (technical || 0) * 0.2 + (entityStrength || 0) * 0.15)
      : clamp(
          (aiVisibility || 0) * 0.34 +
            (aeo || 0) * 0.14 +
            (geo || 0) * 0.14 +
            (technical || 0) * 0.1 +
            (entityStrength || 0) * 0.1 +
            (citationStrength || 0) * 0.1 +
            (competitorAdvantage || 50) * 0.08,
        );

  const scores: Scorecard = {
    buddyScore,
    aiVisibility,
    aeo,
    geo,
    technical,
    entityStrength,
    citationStrength,
    brandConsistency,
    competitorAdvantage,
  };

  const strengths = buildStrengths({
    brand,
    usable: usable.length,
    mentions: mentionRows.length,
    mentionRate,
    citationRate,
    citeRows: citeRows.length,
    crawl,
    avgPos,
    aeo,
    geo,
    platformPerformance,
  });

  const gaps = buildGaps({
    brand,
    usable: usable.length,
    mentions: mentionRows.length,
    mentionRate,
    citationRate,
    crawl,
    competitorMentions,
    knownCompetitors,
    avgPos,
    queries: queries.length,
  });

  const missingSignals = buildMissingSignals(crawl);

  const competitorRows = buildCompetitors(usable, knownCompetitors, observedBrands, brand);
  const shareOfVoice = buildShareOfVoice(usable, brand, competitorRows);
  const coOccurrence = buildCoOccurrence(usable, brand);
  const competitorGaps = buildCompetitorGaps({
    brand,
    mentionRate,
    citationRate,
    avgPos,
    crawl,
    competitorRows,
    usable: usable.length,
  });

  const promptResults = buildPromptResults(research);
  const winningQueries = buildWinning(usable);
  const losingQueries = buildLosing(usable, brand);
  const citedDomains = buildCitedDomains(usable, params.websiteUrl, knownCompetitors);
  const citationGaps = buildCitationGaps(usable, brand, params.websiteUrl, competitorRows);
  const perception = buildPerception(usable);
  const entityProfile = buildEntityProfile(brand, crawl, params.intake, knownCompetitors, observedBrands);

  const methodologyNotes = [
    `${coverage.platformsTested} AI platform${coverage.platformsTested === 1 ? '' : 's'} were actually queried: ${coverage.platformNames.join(', ') || 'none'}.`,
    `${coverage.modelsTested} model${coverage.modelsTested === 1 ? '' : 's'} tested: ${coverage.modelNames.join(', ') || 'none'}.`,
    `${coverage.queriesTransacted} unique prompts were sent; ${coverage.responsesAnalyzed} successful responses were analyzed.`,
    'Prompts are buyer-style questions generated from the intake (products, audience, markets, competitors) plus the crawled homepage.',
    'Brand mentions are detected by exact and token matching against the company name — not by asking the model to score itself.',
    'Citations are extracted only from URLs present in the model answer. Missing URLs are recorded as N/A, not inferred.',
    'Competitor analysis starts from names supplied in intake, then adds brands that actually appeared in sampled answers.',
    'AEO, GEO, and technical scores are computed from observable on-page and HTTP signals on the crawled URL, robots.txt, and sitemap.xml.',
    'BuddyScore is a proprietary BuddyAds.ai composite of on-site signals and sampled AI answers. It is not an internal ranking from OpenAI, Google, Anthropic, Perplexity, or any other provider.',
    conf.reason,
  ];

  return {
    version: REPORT_VERSION,
    analysisId: params.analysisId,
    brandName: brand,
    websiteUrl: params.websiteUrl,
    generatedAt,
    overall: buddyScore ?? 0,
    aeo: aeo ?? 0,
    geo: geo ?? 0,
    llmReady: aiVisibility ?? 0,
    grade: gradeOf(buddyScore ?? 0),
    confidence: conf.level,
    confidenceReason: conf.reason,
    scores,
    coverage,
    platformPerformance,
    strengths,
    gaps,
    missingSignals,
    competitors: competitorRows,
    shareOfVoice,
    coOccurrence,
    competitorGaps,
    promptResults,
    winningQueries,
    losingQueries,
    citedDomains,
    ownCitationRate: citationRate,
    citationGaps,
    aeoDetail,
    geoDetail,
    technicalDetail,
    entityProfile,
    perception,
    methodologyNotes,
    crawl,
    research,
    usableCount: usable.length,
    mentionCount: mentionRows.length,
    citationCount: citeRows.length,
    rawStrongest,
    rawWeakest,
  };
}

function buildStrengths(p: {
  brand: string;
  usable: number;
  mentions: number;
  mentionRate: number | null;
  citationRate: number | null;
  citeRows: number;
  crawl: CrawlSnapshot;
  avgPos: number | null;
  aeo: number | null;
  geo: number | null;
  platformPerformance: PlatformPerformance[];
}): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  if (p.mentionRate != null && p.mentionRate >= 40) {
    items.push({
      id: 'mentions',
      title: 'Brand recognition inside AI answers',
      metric: `${fmtPct(p.mentionRate)} mention rate`,
      evidence: `${p.brand} appeared in ${p.mentions} of ${p.usable} successful AI responses.`,
      impact: 'Buyers who ask assistants in this category already have a path to hearing your name.',
    });
  }
  if (p.citationRate != null && p.citationRate >= 15) {
    items.push({
      id: 'citations',
      title: 'Measurable citation footprint',
      metric: `${fmtPct(p.citationRate)} own-domain citation rate`,
      evidence: `Your website was cited in ${p.citeRows} of ${p.usable} analyzed responses.`,
      impact: 'Cited brands are easier for assistants to treat as a source, not only a name in a list.',
    });
  }
  if (p.avgPos != null && p.avgPos <= 2.5) {
    items.push({
      id: 'position',
      title: 'Early position when mentioned',
      metric: `Average position ${p.avgPos}`,
      evidence: `When ${p.brand} is named, it tends to appear among the first brands in the answer.`,
      impact: 'Early placement in a recommendation list is closer to a shortlist than a footnote.',
    });
  }
  if (p.crawl.hasOrgSchema || p.crawl.hasSchema) {
    items.push({
      id: 'entity',
      title: 'Machine-readable entity signals',
      metric: p.crawl.hasOrgSchema ? 'Organization schema present' : 'Structured data present',
      evidence: p.crawl.schemaTypes.length
        ? `Detected schema types: ${p.crawl.schemaTypes.slice(0, 6).join(', ')}.`
        : 'JSON-LD or microdata was detected on the crawled page.',
      impact: 'Clear entity markup helps generative engines ground who you are and what you offer.',
    });
  }
  if (p.crawl.hasFaq || p.crawl.hasFaqSchema) {
    items.push({
      id: 'faq',
      title: 'Answer-ready content',
      metric: p.crawl.hasFaqSchema ? 'FAQPage schema' : 'FAQ content detected',
      evidence: p.crawl.hasFaqSchema
        ? 'FAQPage structured data is present, which models can extract as Q&A.'
        : 'FAQ language was detected on the crawled page.',
      impact: 'Explicit Q&A is one of the most extractable formats for answer engines.',
    });
  }
  if (p.crawl.wordCount > 500) {
    items.push({
      id: 'substance',
      title: 'Enough on-page substance to quote',
      metric: `${p.crawl.wordCount} words crawled`,
      evidence: 'The primary page is not a thin stub — models have copy they can ground against.',
      impact: 'Thin pages give assistants little reliable surface to recommend or cite.',
    });
  }
  const strongPlatforms = p.platformPerformance.filter((x) => (x.mentionRate || 0) >= 50);
  if (strongPlatforms.length) {
    items.push({
      id: 'platform',
      title: 'Uneven but real platform traction',
      metric: strongPlatforms.map((x) => x.platform).join(', '),
      evidence: `${strongPlatforms.map((x) => `${x.platform} mention rate ${fmtPct(x.mentionRate)}`).join('; ')}.`,
      impact: 'Platforms that already name you are the fastest places to deepen coverage.',
    });
  }
  return items.slice(0, 5);
}

function buildGaps(p: {
  brand: string;
  usable: number;
  mentions: number;
  mentionRate: number | null;
  citationRate: number | null;
  crawl: CrawlSnapshot;
  competitorMentions: number;
  knownCompetitors: string[];
  avgPos: number | null;
  queries: number;
}): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  if (p.usable > 0 && (p.mentionRate == null || p.mentionRate < 50)) {
    items.push({
      id: 'mention-gap',
      title: 'Incomplete brand presence in AI answers',
      metric: fmtPct(p.mentionRate),
      evidence: `${p.brand} was named in ${p.mentions} of ${p.usable} successful responses (${p.queries} unique queries).`,
      impact: 'High',
      area: 'AI Visibility',
      severity: 'High',
    });
  }
  if (p.usable > 0 && (p.citationRate == null || p.citationRate < 25)) {
    items.push({
      id: 'citation-gap',
      title: 'Limited first-party citations',
      metric: fmtPct(p.citationRate),
      evidence: 'Assistants rarely pointed to your own domain as a source in this sample.',
      impact: 'High',
      area: 'Citation Strength',
      severity: 'High',
    });
  }
  if (p.competitorMentions > p.mentions && p.usable > 0) {
    items.push({
      id: 'differentiation',
      title: 'Weak competitor differentiation',
      metric: `${p.competitorMentions} responses named competitors vs ${p.mentions} naming you`,
      evidence: p.knownCompetitors.length
        ? `Tracked competitors: ${p.knownCompetitors.join(', ')}.`
        : 'Other brands appeared more often than you in category-style answers.',
      impact: 'High',
      area: 'AI Visibility',
      severity: 'High',
    });
  }
  if (p.avgPos != null && p.avgPos > 3) {
    items.push({
      id: 'position-gap',
      title: 'Late mention when you are included',
      metric: `Average position ${p.avgPos}`,
      evidence: 'When named, you tend to appear after other brands in the same answer.',
      impact: 'Medium',
      area: 'AI Visibility',
      severity: 'Medium',
    });
  }
  if (!p.crawl.hasFaq && !p.crawl.hasFaqSchema) {
    items.push({
      id: 'faq-gap',
      title: 'Missing answer-shaped content',
      metric: 'FAQ not detected',
      evidence: 'The crawled page did not expose a FAQ block or FAQPage schema.',
      impact: 'Medium',
      area: 'AEO',
      severity: 'Medium',
    });
  }
  if (!p.crawl.hasProductSchema) {
    items.push({
      id: 'product-schema',
      title: 'Product / service entity is under-specified',
      metric: 'No Product or Service schema',
      evidence: 'JSON-LD did not include Product, Service, or SoftwareApplication types.',
      impact: 'Medium',
      area: 'GEO',
      severity: 'Medium',
    });
  }
  if (!p.crawl.hasComparison) {
    items.push({
      id: 'comparison',
      title: 'No comparison surface for category queries',
      metric: 'Comparison copy not detected',
      evidence: 'The crawled page did not discuss alternatives, versus, or comparisons.',
      impact: 'Medium',
      area: 'Content',
      severity: 'Medium',
    });
  }
  if (p.crawl.wordCount > 0 && p.crawl.wordCount < 300) {
    items.push({
      id: 'thin',
      title: 'Thin primary page',
      metric: `${p.crawl.wordCount} words`,
      evidence: 'There is little extractable copy for a model to quote with confidence.',
      impact: 'High',
      area: 'Technical / Content',
      severity: 'High',
    });
  }
  return items.slice(0, 5);
}

function buildMissingSignals(c: CrawlSnapshot): MissingSignal[] {
  const rows: MissingSignal[] = [];
  const push = (on: boolean, signal: string, observed: string, why: string, rec: string) => {
    if (!on) rows.push({ signal, observed, whyItMatters: why, recommendation: rec });
  };
  push(!c.hasFaq && !c.hasFaqSchema, 'FAQ content', 'No FAQ block or FAQPage schema detected.', 'Answer engines prefer explicit questions and short answers.', 'Publish a public FAQ that mirrors real buyer questions, with FAQPage schema.');
  push(!c.hasProductSchema, 'Product / Service schema', 'No Product, Service, or SoftwareApplication markup.', 'Without product entities, models guess what you sell from prose alone.', 'Add Product or Service JSON-LD on commercial pages.');
  push(!c.hasOrgSchema, 'Organization entity', 'Organization schema not detected.', 'Knowledge-graph style systems need a stable organization node.', 'Add Organization JSON-LD with legal name, URL, logo, and sameAs profiles.');
  push(!c.hasComparison, 'Comparison content', 'No vs / alternative language on the crawled page.', 'Category prompts are often answered as comparisons. If you are absent from that frame, someone else fills it.', 'Ship a comparison or alternatives page that names the real competitive set.');
  push(!c.hasAuthor && !c.hasPersonSchema, 'Expert authorship', 'No author / Person signals detected.', 'Cited pages often carry a named expert. Anonymous pages are harder to treat as authority.', 'Add bylines, Person schema, and credentials on research and explainer pages.');
  push(!c.hasLocation && !c.hasLocalBusiness, 'Location information', 'No address or LocalBusiness signals detected.', 'Geo and “near me” style prompts need a place entity.', 'Publish locations (or service areas) in copy and LocalBusiness schema if relevant.');
  push(!c.hasAbout, 'About / entity story', 'About-page cues were weak or absent.', 'Models use About copy to decide what the company is.', 'Make the About page explicit: who you are, what you sell, who you serve.');
  push(c.externalLinkCount < 2, 'Authoritative references', `Only ${c.externalLinkCount} external links counted.`, 'Outbound references to standards, research, and partners help models corroborate claims.', 'Cite primary sources, certifications, and third-party proof on key pages.');
  push(c.questionHeadings < 2, 'Topical question coverage', `${c.questionHeadings} question-style headings.`, 'If you never phrase the buyer’s question, assistants borrow someone else’s framing.', 'Turn high-intent queries into H2s with direct-answer openings.');
  push(!c.hasSitemap, 'XML sitemap', c.hasSitemap === false ? 'sitemap.xml not found.' : 'Sitemap probe inconclusive.', 'Sitemaps help discovery of the pages you actually want cited.', 'Publish and reference a complete XML sitemap.');
  return rows.slice(0, 10);
}

function buildCompetitors(
  usable: ResearchRow[],
  known: string[],
  observed: string[],
  brand: string,
): CompetitorRow[] {
  const names = uniqueNames([...known, ...observed]).filter((n) => n.toLowerCase() !== brand.toLowerCase());
  return names
    .map((name) => {
      const hits = usable.filter((r) => detectMention(r.answer, name));
      const cites = hits.filter((r) => r.citations.length > 0).length;
      const platforms = uniqueNames(hits.map((r) => r.platform));
      return {
        name,
        mentions: hits.length,
        mentionRate: rate(hits.length, usable.length),
        citations: cites,
        platforms,
        favoredBy: platforms,
      };
    })
    .filter((c) => c.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 12);
}

function buildShareOfVoice(
  usable: ResearchRow[],
  brand: string,
  competitors: CompetitorRow[],
): ShareOfVoiceRow[] {
  if (!usable.length) return [];
  const brandMentions = usable.filter((r) => r.brandMentioned).length;
  const rows: ShareOfVoiceRow[] = [
    { name: brand, mentions: brandMentions, share: rate(brandMentions, usable.length), isBrand: true },
    ...competitors.slice(0, 6).map((c) => ({
      name: c.name,
      mentions: c.mentions,
      share: c.mentionRate,
      isBrand: false,
    })),
  ];
  return rows;
}

function buildCoOccurrence(usable: ResearchRow[], brand: string): CoOccurrence[] {
  const counts = new Map<string, number>();
  for (const r of usable) {
    if (!r.brandMentioned) continue;
    for (const other of uniqueNames([...r.competitorsMentioned, ...r.observedBrands])) {
      if (other.toLowerCase() === brand.toLowerCase()) continue;
      counts.set(other, (counts.get(other) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([b, count]) => ({ brand: b, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function buildCompetitorGaps(p: {
  brand: string;
  mentionRate: number | null;
  citationRate: number | null;
  avgPos: number | null;
  crawl: CrawlSnapshot;
  competitorRows: CompetitorRow[];
  usable: number;
}): CompetitorGapRow[] {
  const top = p.competitorRows[0];
  if (!top || !p.usable) return [];
  const yoursTopic = p.crawl.headings.length ? Math.min(100, p.crawl.headings.length * 8 + (p.crawl.wordCount > 400 ? 20 : 0)) : null;
  const rows: CompetitorGapRow[] = [
    {
      area: 'AI Mentions',
      yours: fmtPct(p.mentionRate),
      competitor: fmtPct(top.mentionRate),
      competitorName: top.name,
      gap:
        p.mentionRate != null && top.mentionRate != null
          ? `${Math.round((p.mentionRate - top.mentionRate) * 10) / 10} pp`
          : 'N/A',
    },
    {
      area: 'Citations (responses with URLs)',
      yours: fmtPct(p.citationRate),
      competitor: `${top.citations}`,
      competitorName: top.name,
      gap: 'See evidence in Citation Intelligence',
    },
    {
      area: 'Average Position',
      yours: fmtNum(p.avgPos),
      competitor: 'N/A',
      competitorName: top.name,
      gap: 'Competitor position is not ranked unless they appear in the same answer.',
    },
    {
      area: 'Topic Coverage (on-site headings)',
      yours: yoursTopic == null ? 'N/A' : `${yoursTopic}`,
      competitor: 'N/A',
      competitorName: top.name,
      gap: 'Competitor sites were not crawled in this analysis.',
    },
  ];
  return rows;
}

function buildPromptResults(research: ResearchRow[]): PromptResult[] {
  const byQ = new Map<string, ResearchRow[]>();
  for (const r of research) {
    const list = byQ.get(r.question) || [];
    list.push(r);
    byQ.set(r.question, list);
  }
  return [...byQ.entries()].map(([query, rows]) => ({
    query,
    platforms: rows.map((r) => ({
      platform: r.platform,
      model: shortModelName(r.model),
      mentioned: r.error ? null : r.brandMentioned,
      position: r.brandPosition,
      competitors: uniqueNames([...r.competitorsMentioned, ...r.observedBrands]).slice(0, 6),
      citations: r.citations.map((c) => c.domain),
      source: r.citations[0]?.domain || null,
      error: r.error,
    })),
  }));
}

function buildWinning(usable: ResearchRow[]): QueryOutcome[] {
  return usable
    .filter((r) => r.brandMentioned)
    .map((r) => ({
      query: r.question,
      platform: r.platform,
      position: r.brandPosition,
      mentioned: true,
      cited: r.ownDomainCited,
      competitors: uniqueNames([...r.competitorsMentioned, ...r.observedBrands]).slice(0, 5),
    }))
    .sort((a, b) => (a.position || 99) - (b.position || 99))
    .slice(0, 8);
}

function buildLosing(usable: ResearchRow[], brand: string): QueryOutcome[] {
  return usable
    .filter((r) => !r.brandMentioned && (r.competitorsMentioned.length > 0 || r.observedBrands.length > 0))
    .map((r) => {
      const who = uniqueNames([...r.competitorsMentioned, ...r.observedBrands]);
      return {
        query: r.question,
        platform: r.platform,
        position: null,
        mentioned: false,
        cited: r.ownDomainCited,
        competitors: who.slice(0, 5),
        whoWon: who[0],
        why: `${brand} was not named; ${who.slice(0, 3).join(', ')} appeared instead.`,
        missing: 'A citable comparison, category proof, or third-party mention that would justify inclusion.',
        opportunity: `Create an answer-ready page that directly addresses this query and names the competitive set.`,
      };
    })
    .slice(0, 8);
}

function buildCitedDomains(
  usable: ResearchRow[],
  websiteUrl: string,
  competitors: string[],
): CitedDomain[] {
  const host = domainOfUrl(websiteUrl);
  const map = new Map<string, CitedDomain>();
  for (const r of usable) {
    for (const c of r.citations) {
      const cur = map.get(c.domain) || {
        domain: c.domain,
        frequency: 0,
        platforms: [],
        isOwn: c.domain === host || c.domain.endsWith(`.${host}`),
        isCompetitor: competitors.some((n) => c.domain.includes(n.toLowerCase().replace(/\s+/g, ''))),
      };
      cur.frequency += 1;
      if (!cur.platforms.includes(r.platform)) cur.platforms.push(r.platform);
      map.set(c.domain, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.frequency - a.frequency).slice(0, 16);
}

function buildCitationGaps(
  usable: ResearchRow[],
  brand: string,
  websiteUrl: string,
  competitors: CompetitorRow[],
): CitationGapRow[] {
  const host = domainOfUrl(websiteUrl);
  const ownDomains = new Set(
    usable.filter((r) => r.brandMentioned).flatMap((r) => r.citations.map((c) => c.domain)),
  );
  ownDomains.add(host);
  return competitors.slice(0, 5).map((comp) => {
    const domains = uniqueNames(
      usable
        .filter((r) => detectMention(r.answer, comp.name))
        .flatMap((r) => r.citations.map((c) => c.domain))
        .filter((d) => !ownDomains.has(d)),
    ).slice(0, 8);
    const yours = uniqueNames(
      usable.filter((r) => r.brandMentioned).flatMap((r) => r.citations.map((c) => c.domain)),
    ).slice(0, 8);
    return {
      competitor: comp.name,
      domains,
      yours,
      opportunity: domains.length
        ? `Earn mentions or coverage on ${domains.slice(0, 3).join(', ')} — sources that already appear when AI discusses ${comp.name}.`
        : `No third-party domains were extracted for ${comp.name} in this sample.`,
    };
  });
}

function buildPerception(usable: ResearchRow[]): Perception | null {
  const withSent = usable.filter((r) => r.sentiment);
  if (!withSent.length) return null;
  const counts = { positive: 0, neutral: 0, negative: 0, mixed: 0 };
  for (const r of withSent) {
    if (r.sentiment) counts[r.sentiment] += 1;
  }
  const quotes = withSent
    .filter((r) => r.brandMentioned && r.answer)
    .slice(0, 4)
    .map((r) => {
      const sentences = r.answer.split(/(?<=[.!?])\s+/);
      const hit =
        sentences.find((s) => s.length > 24 && s.length < 400) ||
        sentences[0] ||
        r.answer;
      const text = (hit.length > 280 ? `${hit.slice(0, 280)}…` : hit).trim();
      return { text, platform: r.platform, sentiment: r.sentiment || 'neutral' };
    });
  const interpretation =
    counts.negative > counts.positive
      ? 'Observed answers that mention the brand lean cautious or qualified rather than openly recommended.'
      : counts.positive > 0
        ? 'When the brand is described, sampled answers more often use recommend-style language than caution.'
        : 'Most mentions are factual rather than strongly positive or negative.';
  return { ...counts, observedQuotes: quotes, interpretation };
}

function buildEntityProfile(
  brand: string,
  crawl: CrawlSnapshot,
  intake: IntakeContext | null | undefined,
  known: string[],
  observed: string[],
): EntityProfile {
  const missing: string[] = [];
  const inconsistent: string[] = [];
  if (!intake?.productsServices) missing.push('Products');
  if (!crawl.hasAbout) missing.push('Company story / About');
  if (!intake?.countries && !crawl.hasLocation) missing.push('Locations');
  if (!crawl.hasProductSchema) missing.push('Product entity markup');
  if (!intake?.idealCustomers) missing.push('Audience definition on-site');
  const brandToken = brand.split(/\s+/)[0] || brand;
  if (crawl.title && !crawl.title.toLowerCase().includes(brandToken.toLowerCase())) {
    inconsistent.push('Page title does not clearly carry the brand name.');
  }
  if (crawl.h1.length > 1) inconsistent.push('Multiple H1s make the primary entity less obvious.');
  return {
    company: brand,
    products: intake?.productsServices || null,
    services: intake?.productsServices || null,
    industry: intake?.businessDescription?.slice(0, 180) || null,
    locations: intake?.countries || (crawl.hasLocation ? 'Location cues detected on-site' : null),
    audience: intake?.idealCustomers || null,
    topics: crawl.headings.slice(0, 10),
    competitors: uniqueNames([...known, ...observed]).slice(0, 10),
    technology: crawl.schemaTypes.length ? crawl.schemaTypes.slice(0, 6).join(', ') : null,
    missing,
    inconsistent,
  };
}

export function fallbackNarrative(intel: ReturnType<typeof buildIntelligence>): {
  summary: string;
  executiveSummary: ReportPayload['executiveSummary'];
  finalTakeaway: string;
  strongestPlatform: PlatformSpotlight | null;
  weakestPlatform: PlatformSpotlight | null;
  opportunities: Opportunity[];
  howToDoBetter: HowToItem[];
  plan7Day: DayPlan[];
  roadmap30: WeekPlan[];
  strategy90: MonthPlan[];
  competitorInsights: string;
} {
  const s = intel.scores;
  const best = intel.rawStrongest;
  const worst = intel.rawWeakest;
  const strongest: PlatformSpotlight | null = best
    ? {
        platform: best.platform,
        model: best.model,
        visibility: best.visibility,
        mentionRate: best.mentionRate,
        avgPosition: best.avgPosition,
        citationRate: best.citationRate,
        evidence: `${best.platform} named ${intel.brandName} in ${best.mentions}/${best.queries} queried prompts (mention rate ${fmtPct(best.mentionRate)}).`,
        interpretation:
          (best.mentionRate || 0) >= 50
            ? `${best.platform} already has enough category context to include ${intel.brandName}. Deepen the pages and third-party sources this model can cite.`
            : `${best.platform} is the relatively strongest surface, but mention rate ${fmtPct(best.mentionRate)} is not yet a reliable recommendation pattern.`,
      }
    : null;
  const weakest: PlatformSpotlight | null = worst
    ? {
        platform: worst.platform,
        model: worst.model,
        visibility: worst.visibility,
        mentionRate: worst.mentionRate,
        avgPosition: worst.avgPosition,
        citationRate: worst.citationRate,
        evidence: `${worst.platform} named ${intel.brandName} in ${worst.mentions}/${worst.queries} queried prompts (mention rate ${fmtPct(worst.mentionRate)}).`,
        interpretation:
          (worst.mentionRate || 0) < 30
            ? `${worst.platform} is not retrieving ${intel.brandName} for these buyer questions. That usually means weak third-party corroboration, missing comparison pages, or an unclear entity — not a “ranking penalty.”`
            : `Coverage on ${worst.platform} is thinner than your best platform. Close the specific prompt gaps in Losing Queries before chasing new topics.`,
      }
    : null;

  const howTo: HowToItem[] = intel.gaps.slice(0, 5).map((g) => ({
    problem: g.title,
    whyItMatters: g.impact === 'High' || g.severity === 'High'
      ? 'This gap changes whether an assistant includes you in a buying shortlist.'
      : 'This gap limits how completely AI can describe or cite you.',
    evidence: g.evidence,
    recommendedAction: intel.missingSignals.find((m) => g.id.includes('faq') && m.signal.includes('FAQ'))
      ? 'Publish answer-ready FAQ and comparison content with schema.'
      : `Fix the observed ${g.area || 'visibility'} gap with citable, entity-clear content.`,
    implementation:
      g.id === 'faq-gap'
        ? 'List the 10 questions buyers actually ask (use Losing Queries). Answer each in 40–80 words, then add FAQPage JSON-LD.'
        : g.id === 'product-schema'
          ? 'Add Product/Service JSON-LD (name, description, brand, URL) on the homepage and key commercial URLs.'
          : g.id === 'comparison'
            ? 'Ship a /compare or /alternatives page that names real competitors and states who you are for.'
            : g.id === 'citation-gap'
              ? 'Place unique stats, definitions, and proof on indexable URLs; pursue one third-party mention in a source already cited in this report.'
              : 'Create one indexable page that answers the losing queries in plain language and states the entity (who, what, for whom).',
    priority: (g.severity as HowToItem['priority']) || 'Medium',
    difficulty: g.id.includes('schema') || g.id.includes('faq') ? 'Easy' : g.id.includes('mention') ? 'Hard' : 'Medium',
    expectedImpact:
      g.area === 'AI Visibility'
        ? 'Potential impact on mention rate and BuddyScore directionally, not a guaranteed point increase.'
        : `Potential improvement in ${g.area || 'on-site AI readiness'} based on the missing signal observed.`,
  }));

  const missingHow: HowToItem[] = intel.missingSignals.slice(0, 3).map((m) => ({
    problem: m.signal,
    whyItMatters: m.whyItMatters,
    evidence: m.observed,
    recommendedAction: m.recommendation,
    implementation: m.recommendation,
    priority: 'Medium',
    difficulty: 'Easy',
    expectedImpact: 'Potential improvement in AEO/GEO extractability. Not a guaranteed score change.',
  }));

  const howToDoBetter = (howTo.length ? howTo : missingHow).slice(0, 6);

  const opportunities: Opportunity[] = howToDoBetter.slice(0, 5).map((h, i) => ({
    rank: i + 1,
    title: h.recommendedAction,
    impact: h.priority,
    difficulty: h.difficulty,
    confidence: intel.confidence,
    platforms: intel.coverage.platformNames,
    evidence: h.evidence,
    strategicValue: h.expectedImpact,
  }));

  const plan7Day: DayPlan[] = [
    { day: 1, title: 'Entity lock', task: 'Confirm legal name, homepage H1, and Organization JSON-LD match.', connectedProblem: intel.entityProfile.missing.includes('Company story / About') ? 'Weak entity definition' : 'Brand consistency' },
    { day: 2, title: 'Meta & canonical', task: 'Write a 150–160 character description that states who you serve and what you sell. Confirm canonical.', connectedProblem: 'Metadata / extractability' },
    { day: 3, title: 'FAQ draft', task: 'Turn the losing queries in this report into 8–10 public Q&As.', connectedProblem: 'Missing FAQ content' },
    { day: 4, title: 'Schema', task: 'Add FAQPage + Product/Service JSON-LD on the URLs you will keep.', connectedProblem: 'Missing Product schema' },
    { day: 5, title: 'Comparison outline', task: 'Outline one alternatives page using the competitors AI actually named.', connectedProblem: 'Weak competitor differentiation' },
    { day: 6, title: 'Proof block', task: 'Add one citable statistic, customer proof, or definition callout on the primary page.', connectedProblem: 'Limited citations' },
    { day: 7, title: 'Indexation check', task: 'Confirm robots.txt, sitemap.xml, and that key URLs are not noindexed.', connectedProblem: 'Technical AI readiness' },
  ];

  const roadmap30: WeekPlan[] = [
    { week: 1, theme: 'Foundation', tasks: [
      { task: 'Ship Organization + Product/Service schema and fix title/H1 entity clarity.', connectedProblem: 'Entity strength' },
      { task: 'Publish robots.txt and sitemap if missing; remove accidental noindex.', connectedProblem: 'Technical readiness' },
    ]},
    { week: 2, theme: 'Content', tasks: [
      { task: 'Launch FAQ answering the losing queries from this sample.', connectedProblem: 'AEO / question coverage' },
      { task: 'Expand thin sections so each commercial page has extractable answers.', connectedProblem: 'Content extractability' },
    ]},
    { week: 3, theme: 'Authority', tasks: [
      { task: 'Publish the comparison page naming the brands AI already recommends.', connectedProblem: 'Share of voice gap' },
      { task: 'Add authorship and one third-party proof link on the pages you want cited.', connectedProblem: 'Citation gap' },
    ]},
    { week: 4, theme: 'AI visibility optimization', tasks: [
      { task: 'Align on-page language with the exact buyer prompts in Prompt-Level Results.', connectedProblem: 'Prompt-level losses' },
      { task: 'Re-run a BuddyAds check on the same platforms and compare mention/citation rates.', connectedProblem: 'Measurement' },
    ]},
  ];

  const strategy90: MonthPlan[] = [
    { month: 1, theme: 'Fix', tasks: ['Close technical, schema, FAQ, and entity gaps observed in this report.', 'Make the primary URLs answer-shaped and crawlable.'] },
    { month: 2, theme: 'Build', tasks: ['Ship topical clusters around products/services in the entity profile.', 'Earn or create citable proof (case studies, original stats, partner pages).'] },
    { month: 3, theme: 'Expand', tasks: ['Pursue the citation domains competitors appear with.', 'Re-measure all tested platforms and close remaining model-specific gaps.'] },
  ];

  const topStrengths = intel.strengths.slice(0, 3).map((x) => x.title);
  const topGaps = intel.gaps.slice(0, 3).map((x) => x.title);
  const next = howToDoBetter.slice(0, 3).map((x) => x.recommendedAction);

  const executiveSummary = {
    where: `${intel.brandName} BuddyScore is ${fmtNum(s.buddyScore)} / 100 (grade ${intel.grade}), with ${intel.confidence.toLowerCase()} research confidence.`,
    visibility: intel.usableCount
      ? `Mentioned in ${intel.mentionCount}/${intel.usableCount} successful responses (${fmtPct(rate(intel.mentionCount, intel.usableCount))}). Own-domain citations in ${intel.citationCount}/${intel.usableCount} (${fmtPct(intel.ownCitationRate)}). AI visibility ${fmtNum(s.aiVisibility)}.`
      : 'No successful AI responses were available in this run, so visibility metrics are N/A. On-site AEO/GEO/technical scores still apply.',
    strengths: topStrengths.length ? topStrengths : ['On-site signals were collected; LLM strengths need a successful multi-model sample.'],
    gaps: topGaps.length ? topGaps : intel.missingSignals.slice(0, 3).map((m) => m.signal),
    next: next.length ? next : ['Re-run with configured AI platforms to fill visibility metrics.'],
  };

  const summary = [
    executiveSummary.where,
    executiveSummary.visibility,
    intel.confidenceReason,
  ].join(' ');

  const finalTakeaway = intel.usableCount
    ? `AI already has a partial picture of ${intel.brandName}. The work now is to become the brand assistants can name, place, and cite — starting with the 7-day entity, FAQ, and comparison fixes, then the 30- and 90-day authority plan.`
    : `We could not sample live AI answers in this run. Treat AEO, GEO, and technical findings as the foundation, then re-run once model access is configured so BuddyScore includes real mention and citation evidence.`;

  const competitorInsights = intel.competitors.length
    ? `AI named ${intel.competitors.slice(0, 4).map((c) => c.name).join(', ')} alongside or instead of ${intel.brandName} in this sample. ${intel.coOccurrence.length ? `Most frequent co-occurrence: ${intel.coOccurrence[0].brand} (${intel.coOccurrence[0].count}).` : ''}`
    : intel.usableCount
      ? `No tracked competitors were detected in sampled answers. ${intel.coverage.brandsTracked <= 1 ? 'Add competitor names on intake to measure share of voice more precisely.' : 'Tracked names did not appear in this sample.'}`
      : 'Competitor visibility requires successful AI responses.';

  return {
    summary,
    executiveSummary,
    finalTakeaway,
    strongestPlatform: strongest,
    weakestPlatform: weakest,
    opportunities,
    howToDoBetter,
    plan7Day,
    roadmap30,
    strategy90,
    competitorInsights,
  };
}
