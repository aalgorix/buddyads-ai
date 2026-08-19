/**
 * Single source of methodology thresholds. Do not duplicate these inline.
 * Bump METHODOLOGY_VERSION whenever the score formula or sampling rules change
 * so clients can tell pre/post reports are not comparable.
 */
export const METHODOLOGY_VERSION = '2026.08.3';

export const METHODOLOGY = {
  defaultQueryCount: 32,
  minQueryCount: 25,
  maxQueryCount: 40,
  /** n < this → "Directional only — based on a limited sample." */
  directionalSampleThreshold: 20,
  sampleCaveat: 'Directional only — based on a limited sample.',
  llmConcurrencyDefault: 2,
  interPromptDelayMs: 250,
  providerRetryAttempts: 3,
  retryBaseMs: 800,
  confidence: {
    highUsableLlms: 3,
    highSampleSize: 30,
    mediumUsableLlms: 2,
    mediumSampleSize: 20,
  },
  /**
   * On-site AI-readiness confidence — crawl completeness only.
   * Does not use usable LLM count, mention rate, or n.
   * High: wordCount >= highWordCount AND robots.txt probed AND sitemap probed.
   * Medium: crawled page with wordCount >= mediumWordCount, but not High.
   * Low: no crawl, or wordCount below mediumWordCount.
   */
  onSiteConfidence: {
    highWordCount: 800,
    mediumWordCount: 150,
  },
} as const;

export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export function resolveQueryCount(envValue?: string | number | null): number {
  const raw = envValue == null || envValue === '' ? METHODOLOGY.defaultQueryCount : Number(envValue);
  const n = Number.isFinite(raw) ? raw : METHODOLOGY.defaultQueryCount;
  return Math.max(METHODOLOGY.minQueryCount, Math.min(METHODOLOGY.maxQueryCount, Math.round(n)));
}

export function sampleCaveatFor(n: number): string | null {
  return n < METHODOLOGY.directionalSampleThreshold ? METHODOLOGY.sampleCaveat : null;
}

export function confidenceOf(params: {
  usableLlms: number;
  queriedLlms: number;
  sampleSize: number;
}): { level: ConfidenceLevel; reason: string } {
  const { usableLlms, queriedLlms, sampleSize } = params;
  const of = `${usableLlms} of ${queriedLlms} platform${queriedLlms === 1 ? '' : 's'} returned usable data`;
  const nBit = `n=${sampleSize}`;

  if (usableLlms < 2) {
    return {
      level: 'Low',
      reason: `Confidence: Low — ${of}.`,
    };
  }

  const { highUsableLlms, highSampleSize, mediumUsableLlms, mediumSampleSize } = METHODOLOGY.confidence;
  if (usableLlms >= highUsableLlms && sampleSize >= highSampleSize) {
    return {
      level: 'High',
      reason: `Confidence: High — ${of}, ${nBit}.`,
    };
  }
  if (usableLlms >= mediumUsableLlms && sampleSize >= mediumSampleSize) {
    return {
      level: 'Medium',
      reason: `Confidence: Medium — ${of}, ${nBit}.`,
    };
  }
  return {
    level: 'Low',
    reason: `Confidence: Low — ${of}, ${nBit}.`,
  };
}

export function onSiteConfidenceOf(params: {
  wordCount: number;
  robotsTxtFound: boolean | null;
  hasSitemap: boolean | null;
}): { level: ConfidenceLevel; reason: string } {
  const { wordCount, robotsTxtFound, hasSitemap } = params;
  const { highWordCount, mediumWordCount } = METHODOLOGY.onSiteConfidence;
  const robotsProbed = robotsTxtFound !== null;
  const sitemapProbed = hasSitemap !== null;
  const nWords = `${wordCount.toLocaleString('en-US')} words crawled`;

  if (wordCount < mediumWordCount) {
    return {
      level: 'Low',
      reason: `Confidence: Low — ${wordCount === 0 ? 'no crawl text was captured' : `only ${nWords}`}. Independent of LLM sample size.`,
    };
  }
  if (wordCount >= highWordCount && robotsProbed && sitemapProbed) {
    return {
      level: 'High',
      reason: `Confidence: High — ${nWords}; robots.txt and sitemap probed. Independent of LLM sample size.`,
    };
  }
  const gaps: string[] = [];
  if (wordCount < highWordCount) gaps.push(`page under ${highWordCount} words`);
  if (!robotsProbed) gaps.push('robots.txt not probed');
  if (!sitemapProbed) gaps.push('sitemap not probed');
  return {
    level: 'Medium',
    reason: `Confidence: Medium — ${nWords}${gaps.length ? ` (${gaps.join('; ')})` : ''}. Independent of LLM sample size.`,
  };
}

/**
 * Letter-grade bands calibrated after the 2026.08.3 split (Aalgorix fixture:
 * AI Visibility 0, On-site AI-readiness 61). Deliberately not rendered —
 * reports show the two integers plus confidence only. Kept so the
 * calibration is not lost if grades are reinstated later.
 */
export const AI_VISIBILITY_GRADE_BANDS = [
  { band: 'A', min: 75, max: 100, meaning: 'Named often, cited, placed early' },
  { band: 'B', min: 55, max: 74, meaning: 'Regularly named, some citations' },
  { band: 'C', min: 35, max: 54, meaning: 'Intermittent presence' },
  { band: 'D', min: 15, max: 34, meaning: 'Rare mentions' },
  { band: 'F', min: 0, max: 14, meaning: 'Invisible or near-invisible' },
] as const;

export const ON_SITE_GRADE_BANDS = [
  { band: 'A', min: 80, max: 100, meaning: 'Extractable, schema-rich, entity-clear' },
  { band: 'B', min: 65, max: 79, meaning: 'Solid on-site, gaps remain' },
  { band: 'C', min: 50, max: 64, meaning: 'Partial readiness' },
  { band: 'D', min: 35, max: 49, meaning: 'Thin extractability' },
  { band: 'F', min: 0, max: 34, meaning: 'Little crawlable AI-ready signal' },
] as const;
