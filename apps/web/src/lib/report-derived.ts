import type {
  BrandCategory,
  IntelligenceReport,
  LlmStrategyBrief,
  MentionBreakdown,
  ResearchRow,
} from './report-types';
import { mentionRate } from './report-utils';

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
  const score = report.scores.buddyScore ?? report.overall;
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

export function enrichReportDerived(report: IntelligenceReport): IntelligenceReport {
  return {
    ...report,
    brandCategory: report.brandCategory ?? computeBrandCategory(report),
    mentionBreakdown: report.mentionBreakdown ?? computeMentionBreakdown(report.research),
    llmStrategies: report.llmStrategies?.length ? report.llmStrategies : computeLlmStrategies(report),
  };
}
