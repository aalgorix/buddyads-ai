import type {
  BrandCategory,
  LlmStrategyBrief,
  MentionBreakdown,
  PlatformPerformance,
  ResearchRow,
} from '../types/report';

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

export function computeBrandCategory(params: {
  brandName: string;
  buddyScore: number | null;
  mentionRate: number | null;
  citationRate: number | null;
  avgPosition: number | null;
  usableCount: number;
  strongestVisibility: number | null;
}): BrandCategory {
  const { brandName, buddyScore, mentionRate, citationRate, avgPosition, usableCount, strongestVisibility } =
    params;
  const m = mentionRate ?? 0;
  const score = buddyScore ?? 0;
  const cite = citationRate ?? 0;
  const pos = avgPosition ?? 99;

  if (!usableCount) {
    return {
      tier: 'Low visibility',
      summary: `${brandName} could not be measured across live AI answers in this run. On-site readiness scores still apply; re-run when model access is configured.`,
    };
  }

  if (score >= 72 && m >= 55 && pos <= 2.2 && cite >= 15) {
    return {
      tier: 'Category leader',
      summary: `${brandName} is a default recommendation in this sample — named often, cited, and placed early. The work is to protect that position and extend it to weaker assistants.`,
    };
  }

  if (m >= 22 || score >= 48 || (strongestVisibility ?? 0) >= 65) {
    return {
      tier: 'Known alternative',
      summary: `${brandName} is recognised in the category but is not the default recommendation. AI names you in some answers, rarely leads the shortlist, and seldom cites your site.`,
    };
  }

  if (m > 0) {
    return {
      tier: 'Occasional mention',
      summary: `${brandName} surfaces in a minority of answers. Assistants know the name inconsistently and do not treat you as a core option in this category.`,
    };
  }

  return {
    tier: 'Invisible',
    summary: `${brandName} was not named in any successful AI response in this sample. Buyers asking assistants in this category will not hear about you.`,
  };
}

function defaultStrategyNote(platform: string, brand: string, p: PlatformPerformance): string {
  const m = p.mentionRate ?? 0;
  const c = p.citationRate ?? 0;
  if (m >= 60) {
    return `${platform} already includes ${brand} often (${m}% mention rate). Keep entity consistency and add citable proof so early positions become default.`;
  }
  if (m >= 25 && c < 15) {
    return `${platform} mentions ${brand} but rarely links (${c}% citation rate). Add FAQ schema and proof pages it can quote.`;
  }
  if (m < 25) {
    return `${platform} barely surfaces ${brand} (${m}% mention rate). Comparison pages, repeated entity strings, and third-party reviews are the unlock.`;
  }
  return `Strengthen how ${platform} retrieves and cites ${brand} for the buyer prompts in this report.`;
}

const PLATFORM_TAGS: Record<string, { strong: string; weak: string }> = {
  ChatGPT: { strong: 'Protect & extend', weak: 'Enter the shortlist' },
  Claude: { strong: 'Convert mentions to citations', weak: 'Clarify entity' },
  Perplexity: { strong: 'Win the citation war', weak: 'Build citable proof' },
  Gemini: { strong: 'Hold position', weak: 'Enter the shortlist' },
  Copilot: { strong: 'Extend Microsoft surface', weak: 'Basic retrieval fix' },
  Grok: { strong: 'Monitor real-time', weak: 'Category insertion' },
};

export function computeLlmStrategies(
  platformPerformance: PlatformPerformance[],
  brandName: string,
): LlmStrategyBrief[] {
  if (!platformPerformance.length) return [];

  const ranked = [...platformPerformance]
    .filter((p) => p.queries > 0)
    .sort((a, b) => (b.visibility ?? 0) - (a.visibility ?? 0));
  const best = ranked[0]?.platform;
  const worst = ranked.length > 1 ? ranked[ranked.length - 1]?.platform : null;

  return ranked.map((p) => {
    const tags = PLATFORM_TAGS[p.platform] || { strong: 'Optimize', weak: 'Improve visibility' };
    const isBest = p.platform === best;
    const isWeak = p.platform === worst || (p.mentionRate ?? 0) < 28;
    const tag = isBest && (p.mentionRate ?? 0) >= 45 ? tags.strong : isWeak ? tags.weak : tags.strong;
    return {
      platform: p.platform,
      tag,
      note: defaultStrategyNote(p.platform, brandName, p),
    };
  });
}

export const BRAND_CATEGORY_TIERS = [
  'Category leader',
  'Known alternative',
  'Occasional mention',
  'Low visibility',
  'Invisible',
] as const;

export function enrichReportPayload(report: import('../types/report').ReportPayload): import('../types/report').ReportPayload {
  const usable = report.research.filter((r) => r.answer && !r.error);
  const mentionRate =
    usable.length > 0
      ? Math.round((usable.filter((r) => r.brandMentioned).length / usable.length) * 1000) / 10
      : null;
  const positions = usable
    .filter((r) => r.brandMentioned && r.brandPosition != null)
    .map((r) => r.brandPosition as number);
  const avgPosition = positions.length
    ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
    : null;

  return {
    ...report,
    brandCategory:
      report.brandCategory ??
      computeBrandCategory({
        brandName: report.brandName,
        buddyScore: report.scores.buddyScore,
        mentionRate,
        citationRate: report.ownCitationRate,
        avgPosition,
        usableCount: usable.length,
        strongestVisibility: report.strongestPlatform?.visibility ?? report.platformPerformance[0]?.visibility ?? null,
      }),
    mentionBreakdown: report.mentionBreakdown ?? computeMentionBreakdown(report.research),
    llmStrategies:
      report.llmStrategies?.length ? report.llmStrategies : computeLlmStrategies(report.platformPerformance, report.brandName),
  };
}
