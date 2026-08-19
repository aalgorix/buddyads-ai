import type {
  BrandCategory,
  CitationGapRow,
  ClosestCompetitorPlay,
  CompetitorRow,
  CoOccurrence,
  IntelligenceReport,
  LlmStrategyBrief,
  MentionBreakdown,
  QueryOutcome,
  ResearchRow,
} from './report-types';
import { mentionRate } from './report-utils';
import { keepCompleteRecommendations, sanitizeDeep, validateCompetitorName } from './report-integrity';

function rate(num: number, den: number): number | null {
  if (!den) return null;
  return Math.round((num / den) * 1000) / 10;
}

export function computeMentionBreakdown(research: ResearchRow[]): MentionBreakdown {
  const usable = research.filter((r) => r.answer && !r.error);
  const total = usable.length;
  const mentionedNoLink = usable.filter((r) => r.brandMentioned && !r.ownDomainCited).length;
  const mentionedWithLink = usable.filter((r) => r.brandMentioned && r.ownDomainCited).length;
  const noMention = usable.filter((r) => !r.brandMentioned).length;
  return {
    mentionedNoLink,
    mentionedWithLink,
    noMention,
    totalResponses: total,
    mentionedNoLinkRate: rate(mentionedNoLink, total),
    mentionedWithLinkRate: rate(mentionedWithLink, total),
    noMentionRate: rate(noMention, total),
  };
}

export function computeBrandCategory(report: IntelligenceReport): BrandCategory {
  const usable = report.research.filter((r) => r.answer && !r.error);
  const m = mentionRate(report.research);
  const score = report.scores.aiVisibility ?? report.overall;
  const cite = report.ownCitationRate ?? 0;
  const positions = usable
    .filter((r) => r.brandMentioned && r.brandPosition != null)
    .map((r) => r.brandPosition as number);
  const avgPosition = positions.length
    ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
    : null;
  const strongest = report.strongestPlatform?.visibility ?? report.platformPerformance[0]?.visibility ?? null;
  const brandName = report.brandName;

  if (!usable.length) {
    return {
      tier: 'Low visibility',
      summary: `${brandName} could not be measured across live AI answers in this run.`,
    };
  }
  if (score >= 72 && (m ?? 0) >= 55 && (avgPosition ?? 99) <= 2.2 && cite >= 15) {
    return {
      tier: 'Category leader',
      summary: `${brandName} is a default recommendation in this sample — named often, cited, and placed early.`,
    };
  }
  if ((m ?? 0) >= 22 || score >= 48 || (strongest ?? 0) >= 65) {
    return {
      tier: 'Known alternative',
      summary: `${brandName} is recognised in the category but is not the default recommendation.`,
    };
  }
  if ((m ?? 0) > 0) {
    return {
      tier: 'Occasional mention',
      summary: `${brandName} surfaces in a minority of answers only.`,
    };
  }
  return {
    tier: 'Invisible',
    summary: `${brandName} was not named in any successful AI response in this sample.`,
  };
}

const PLATFORM_TAGS: Record<string, { strong: string; weak: string }> = {
  ChatGPT: { strong: 'Protect & extend', weak: 'Enter the shortlist' },
  Claude: { strong: 'Convert mentions to citations', weak: 'Clarify entity' },
  Perplexity: { strong: 'Win the citation war', weak: 'Build citable proof' },
  Gemini: { strong: 'Hold position', weak: 'Enter the shortlist' },
  Copilot: { strong: 'Extend Microsoft surface', weak: 'Basic retrieval fix' },
  Grok: { strong: 'Monitor real-time', weak: 'Category insertion' },
};

export function computeLlmStrategies(report: IntelligenceReport): LlmStrategyBrief[] {
  const ranked = [...report.platformPerformance]
    .filter((p) => p.queries > 0)
    .sort((a, b) => (b.visibility ?? 0) - (a.visibility ?? 0));
  if (!ranked.length) return [];
  const best = ranked[0]?.platform;
  const worst = ranked.length > 1 ? ranked[ranked.length - 1]?.platform : null;

  return ranked.map((p) => {
    const tags = PLATFORM_TAGS[p.platform] || { strong: 'Optimize', weak: 'Improve visibility' };
    const isBest = p.platform === best;
    const isWeak = p.platform === worst || (p.mentionRate ?? 0) < 28;
    const tag = isBest && (p.mentionRate ?? 0) >= 45 ? tags.strong : isWeak ? tags.weak : tags.strong;
    const m = p.mentionRate ?? 0;
    const c = p.citationRate ?? 0;
    let note = `Strengthen how ${p.platform} retrieves ${report.brandName}.`;
    if (m >= 60) note = `${p.platform} already includes ${report.brandName} often. Keep entity consistency and add citable proof.`;
    else if (m >= 25 && c < 15) note = `${p.platform} mentions ${report.brandName} but rarely links. Add FAQ schema and proof pages.`;
    else if (m < 25) note = `${p.platform} barely surfaces ${report.brandName}. Comparison pages and third-party reviews are the unlock.`;
    return { platform: p.platform, tag, note };
  });
}

export const BRAND_CATEGORY_TIERS = [
  'Category leader',
  'Known alternative',
  'Occasional mention',
  'Low visibility',
  'Invisible',
] as const;

function fmtPct(n: number | null): string {
  return n == null ? 'N/A' : `${n}%`;
}

export function computeClosestCompetitors(params: {
  brandName: string;
  competitors: CompetitorRow[];
  coOccurrence: CoOccurrence[];
  citationGaps: CitationGapRow[];
  losingQueries: QueryOutcome[];
  ownMentionRate: number | null;
  hasComparisonPage: boolean;
}): ClosestCompetitorPlay[] {
  const top = [...params.competitors]
    .sort((a, b) => b.mentions - a.mentions || (b.mentionRate || 0) - (a.mentionRate || 0))
    .slice(0, 3);

  return top.map((comp, i) => {
    const rank = i + 1;
    const platforms = (comp.platforms || []).slice(0, 3);
    const platformLabel = platforms.length ? platforms.join(', ') : 'sampled assistants';
    const co = params.coOccurrence.find((c) => c.brand.toLowerCase() === comp.name.toLowerCase());
    const cite = params.citationGaps.find((g) => g.competitor.toLowerCase() === comp.name.toLowerCase());
    const stolen = params.losingQueries.filter(
      (q) =>
        (q.competitors || []).some((n) => n.toLowerCase() === comp.name.toLowerCase()) ||
        q.whoWon?.toLowerCase() === comp.name.toLowerCase(),
    );
    const stolenQuery = stolen[0]?.query;
    const theyLead =
      params.ownMentionRate != null &&
      comp.mentionRate != null &&
      comp.mentionRate > params.ownMentionRate;

    const whyClosest =
      rank === 1
        ? `${comp.name} is the closest rival in this sample: named in ${comp.mentions} answers (${fmtPct(comp.mentionRate)}), most often on ${platformLabel}.`
        : `${comp.name} is closest competitor #${rank}: ${comp.mentions} AI mentions (${fmtPct(comp.mentionRate)}) across ${platformLabel}.`;

    const theyWinOn = theyLead
      ? `AI recommends ${comp.name} more often than ${params.brandName} (${fmtPct(comp.mentionRate)} vs ${fmtPct(params.ownMentionRate)}).${co ? ` They also appear next to you in ${co.count} answers.` : ''}`
      : co
        ? `AI treats ${comp.name} as a peer: they co-occur with ${params.brandName} in ${co.count} answers. You must differentiate, not just get mentioned.`
        : stolen.length
          ? `They take the shortlist when you are absent (${stolen.length} losing quer${stolen.length === 1 ? 'y' : 'ies'} in this sample).`
          : `They show up on ${platformLabel} even when ${params.brandName} does not.`;

    const moves: string[] = [];
    moves.push(
      params.hasComparisonPage
        ? `Rewrite the comparison page so it names ${comp.name} in the H1, first 80 words, and FAQ: "${params.brandName} vs ${comp.name}" plus who each is for.`
        : `Ship /compare/${comp.name.toLowerCase().replace(/\s+/g, '-')} this week: H1 "${params.brandName} vs ${comp.name}", 6 FAQs, and a one-line "choose us if...".`,
    );
    if (cite?.domains?.length && (cite.sourceRefs?.length ?? 0) > 0) {
      moves.push(
        `Get listed where AI already cites ${comp.name}: ${cite.domains.slice(0, 3).join(', ')}. One guest post, directory listing, or original stat on those domains.`,
      );
    } else {
      moves.push(
        `Publish one citable proof block (stat, definition, or case result) on an indexable URL so assistants can quote ${params.brandName} the way they already quote ${comp.name}.`,
      );
    }
    if (stolenQuery) {
      moves.push(
        `Answer this exact prompt on-site in 60-80 words: "${stolenQuery}". Add FAQPage schema. ${comp.name} appeared here; you did not.`,
      );
    } else {
      moves.push(
        `Add an alternatives FAQ: "What is a ${comp.name} alternative?" and answer with ${params.brandName} plus the buyer it is for. Repeat the same sentence on homepage and product page.`,
      );
    }

    return {
      rank,
      name: comp.name,
      mentions: comp.mentions,
      mentionRate: comp.mentionRate,
      platforms,
      whyClosest,
      theyWinOn,
      moves: moves.slice(0, 3),
    };
  });
}

export function enrichReportDerived(report: IntelligenceReport): IntelligenceReport {
  const { grade: _droppedGrade, ...base } = report as IntelligenceReport & { grade?: string };
  void _droppedGrade;
  const competitors = (base.competitors || []).filter(
    (c) => validateCompetitorName(c.name, c.mentions, base.brandName).ok,
  );
  const closestCompetitors = computeClosestCompetitors({
    brandName: base.brandName,
    competitors,
    coOccurrence: base.coOccurrence || [],
    citationGaps: base.citationGaps || [],
    losingQueries: base.losingQueries || [],
    ownMentionRate: mentionRate(base.research),
    hasComparisonPage: Boolean(base.crawl?.hasComparison),
  });
  const howToDoBetter = keepCompleteRecommendations(base.howToDoBetter || []);
  const citationGaps = (base.citationGaps || []).filter(
    (g) => g.domains.length > 0 && (g.sourceRefs?.length ?? 0) > 0,
  );
  return sanitizeDeep({
    ...base,
    competitors,
    howToDoBetter,
    citationGaps,
    coverage: {
      ...base.coverage,
      competitorsTracked: competitors.length,
      platformsUsable: base.coverage.platformsUsable ?? base.platformPerformance.length,
      platformsQueried: base.coverage.platformsQueried ?? base.coverage.platformsTested,
    },
    brandCategory: base.brandCategory ?? computeBrandCategory(base),
    mentionBreakdown: base.mentionBreakdown ?? computeMentionBreakdown(base.research),
    llmStrategies: base.llmStrategies?.length ? base.llmStrategies : computeLlmStrategies(base),
    closestCompetitors,
  });
}
