/**
 * Data-integrity layer between extraction and the client-facing report.
 * Every competitor, string, signal bucket, and displayed count must pass through here.
 */

export const GENERIC_COMPETITOR_NOUNS = new Set(
  [
    'website',
    'site',
    'platform',
    'platforms',
    'software',
    'tool',
    'tools',
    'service',
    'services',
    'company',
    'companies',
    'agency',
    'agencies',
    'solution',
    'solutions',
    'vendor',
    'vendors',
    'app',
    'apps',
    'product',
    'products',
    'provider',
    'providers',
    'system',
    'systems',
    'brand',
    'brands',
    'option',
    'options',
    'alternative',
    'alternatives',
    'business',
    'businesses',
    'online',
    'internet',
    'page',
    'pages',
    'portal',
    'marketplace',
    'application',
    'applications',
    'technology',
    'technologies',
    'firm',
    'firms',
    'partner',
    'partners',
    'customer',
    'customers',
    'user',
    'users',
    'example',
    'examples',
    'others',
    'other',
    'unknown',
    'n/a',
    'na',
    'none',
    'chatgpt',
    'gemini',
    'claude',
    'perplexity',
    'openai',
    'google',
    'anthropic',
    'microsoft',
    'copilot',
    'wikipedia',
    'reddit',
    'forbes',
  ].map((s) => s.toLowerCase()),
);

const REFUSAL_PATTERNS: RegExp[] = [
  /\bi don't know\b/i,
  /\bi do not know\b/i,
  /\bi'm not (sure|able|certain)\b/i,
  /\bi am not (sure|able|certain)\b/i,
  /\bas an ai\b/i,
  /\bi cannot determine\b/i,
  /\bi can't determine\b/i,
  /\bi cannot (help|provide|answer)\b/i,
  /\bi can't (help|provide|answer)\b/i,
  /\bi'm unable to\b/i,
  /\bi am unable to\b/i,
  /\bno information (available|found)\b/i,
  /\bas a language model\b/i,
  /\bi don't have (enough |access to )?information\b/i,
];

export type RejectedCandidate = {
  name: string;
  reason: string;
};

export type LlmResponseStatus = 'success' | 'error' | 'empty' | 'refused';

export type PlatformRunStatus = {
  platform: string;
  model: string;
  queried: number;
  usable: number;
  status: LlmResponseStatus;
  note: string;
};

export type SignalBucket = 'well' | 'poorly' | 'missing';

export type ResolvedSignal = {
  key: string;
  bucket: SignalBucket;
};

const COMMON_NOUNS = new Set(
  [...GENERIC_COMPETITOR_NOUNS, 'website', 'internet', 'data', 'cloud', 'digital', 'global', 'best', 'top'],
);

export function isRefusalText(raw: string | null | undefined): boolean {
  const t = String(raw || '').trim();
  if (!t) return true;
  if (/^n\/?a\.?$/i.test(t)) return true;
  return REFUSAL_PATTERNS.some((re) => re.test(t));
}

export function classifyLlmAnswer(answer: string, error?: string): LlmResponseStatus {
  if (error) return 'error';
  const t = (answer || '').trim();
  if (!t) return 'empty';
  if (isRefusalText(t)) return 'refused';
  return 'success';
}

export function looksLikeProperNoun(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 48) return false;
  const words = trimmed.split(/\s+/);
  if (!words.length) return false;
  if (words.length === 1 && COMMON_NOUNS.has(words[0].toLowerCase())) return false;
  const first = words[0];
  if (!/^[A-Z0-9]/.test(first)) return false;
  if (/^(In|On|At|To|As|If|We|It|An|A|The|This|That|These|Those)$/.test(first)) return false;
  return true;
}

export function isGenericCompetitorName(name: string): boolean {
  const key = name.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!key) return true;
  if (GENERIC_COMPETITOR_NOUNS.has(key)) return true;
  const words = key.split(/\s+/);
  if (words.length === 1 && GENERIC_COMPETITOR_NOUNS.has(words[0])) return true;
  if (words.every((w) => GENERIC_COMPETITOR_NOUNS.has(w) || w.length <= 2)) return true;
  return false;
}

export function validateCompetitorName(
  name: string,
  mentions: number,
  brandName: string,
): { ok: true } | { ok: false; reason: string } {
  const trimmed = name.replace(/\s+/g, ' ').trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (isRefusalText(trimmed)) return { ok: false, reason: 'refusal_or_uncertainty' };
  if (trimmed.toLowerCase() === brandName.trim().toLowerCase()) return { ok: false, reason: 'self_brand' };
  if (isGenericCompetitorName(trimmed)) return { ok: false, reason: 'generic_noun' };
  if (!looksLikeProperNoun(trimmed)) return { ok: false, reason: 'not_proper_noun' };
  if (mentions < 2) return { ok: false, reason: 'below_min_mentions' };
  return { ok: true };
}

export function validateCompetitorList(
  candidates: { name: string; mentions: number }[],
  brandName: string,
  log: (entry: RejectedCandidate) => void = defaultRejectLog,
): string[] {
  const kept: string[] = [];
  for (const c of candidates) {
    const result = validateCompetitorName(c.name, c.mentions, brandName);
    if (!result.ok) {
      log({ name: c.name, reason: result.reason });
      continue;
    }
    kept.push(c.name);
  }
  return kept;
}

function defaultRejectLog(entry: RejectedCandidate) {
  process.stderr.write(`[competitor-reject] name=${JSON.stringify(entry.name)} reason=${entry.reason}\n`);
}

export function sanitizeReportString(raw: string | null | undefined, logLabel?: string): string | null {
  const t = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (isRefusalText(t)) {
    process.stderr.write(`[sanitize-drop] ${logLabel || 'field'} value=${JSON.stringify(t.slice(0, 120))}\n`);
    return null;
  }
  return t;
}

export function sanitizeDeep<T>(value: T, label = 'root'): T {
  if (typeof value === 'string') {
    return (sanitizeReportString(value, label) ?? '') as T;
  }
  if (Array.isArray(value)) {
    return value
      .map((v, i) => sanitizeDeep(v, `${label}[${i}]`))
      .filter((v) => {
        if (typeof v === 'string') return v.length > 0;
        return v != null;
      }) as T;
  }
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    if (typeof rec.provenance === 'string' && typeof rec.sourceRef === 'string') {
      return value;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) {
      out[k] = sanitizeDeep(v, `${label}.${k}`);
    }
    return out as T;
  }
  return value;
}

export function resolveFaqSignal(faqTextPresent: boolean, faqSchemaPresent: boolean): ResolvedSignal {
  if (faqSchemaPresent) return { key: 'faq', bucket: 'well' };
  if (faqTextPresent) return { key: 'faq', bucket: 'poorly' };
  return { key: 'faq', bucket: 'missing' };
}

export function assertExclusiveSignalKeys(
  well: { id: string }[],
  poorly: { id: string }[],
  missing: { id: string }[],
): void {
  const seen = new Map<string, string>();
  const add = (id: string, bucket: string) => {
    const prev = seen.get(id);
    if (prev && prev !== bucket) {
      throw new Error(`Signal key "${id}" appears in both "${prev}" and "${bucket}"`);
    }
    seen.set(id, bucket);
  };
  for (const i of well) add(i.id, 'well');
  for (const i of poorly) add(i.id, 'poorly');
  for (const i of missing) add(i.id, 'missing');
}

export function assertDisplayedCounts(checks: { label: string; displayed: number; actual: number }[]): void {
  const bad = checks.filter((c) => c.displayed !== c.actual);
  if (bad.length) {
    throw new Error(
      `Count mismatch: ${bad.map((c) => `${c.label} displayed=${c.displayed} actual=${c.actual}`).join('; ')}`,
    );
  }
}

export function truncateAtWord(text: string, maxChars: number): string {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxChars) return t;
  const slice = t.slice(0, maxChars);
  const cut = slice.lastIndexOf(' ');
  const base = (cut > 24 ? slice.slice(0, cut) : slice).trim();
  return `${base}...`;
}

export function competitorNoun(n: number): string {
  if (n <= 0) return 'No competitors could be reliably identified from this sample';
  if (n === 1) return '1 closest competitor';
  return `${n} closest competitors`;
}

export function containsRefusalLeak(haystack: string): boolean {
  return REFUSAL_PATTERNS.some((re) => re.test(haystack));
}

export function keepSourcedRecommendations<T extends { sourceRef?: string }>(items: T[]): T[] {
  return items.filter((h) => {
    if (!h.sourceRef) {
      process.stderr.write(
        `[source-ref-drop] ${JSON.stringify((h as { problem?: string }).problem || (h as { title?: string }).title || '')}\n`,
      );
      return false;
    }
    return true;
  });
}

export function keepCompleteRecommendations<T extends {
  sourceRef?: string;
  effort?: string;
  ownerType?: string;
  timeToImpact?: string;
}>(items: T[]): T[] {
  return keepSourcedRecommendations(items).filter((h) => {
    if (!h.effort || !h.ownerType || !h.timeToImpact) {
      process.stderr.write(
        `[rec-meta-drop] ${JSON.stringify((h as { problem?: string }).problem || '')} missing effort/owner/timeToImpact\n`,
      );
      return false;
    }
    return true;
  });
}

export function oneThingFromRanked<T extends { problem: string; recommendedAction: string; sourceRef?: string }>(
  ranked: T[],
): { problem: string; action: string; sourceRef: string } | null {
  const top = ranked[0];
  if (!top?.sourceRef) return null;
  return { problem: top.problem, action: top.recommendedAction, sourceRef: top.sourceRef };
}

export function assertReportCollectionCounts(report: {
  competitors: { name: string }[];
  closestCompetitors: { name: string }[];
  platformPerformance: { platform: string }[];
  coverage: {
    competitorsTracked?: number;
    platformsUsable?: number;
    platformNamesUsable?: string[];
  };
}): void {
  const competitors = report.competitors?.length ?? 0;
  const closest = report.closestCompetitors?.length ?? 0;
  const usableLlms = report.platformPerformance?.length ?? 0;
  assertDisplayedCounts([
    {
      label: 'competitorsTracked',
      displayed: report.coverage.competitorsTracked ?? competitors,
      actual: competitors,
    },
    {
      label: 'closestCompetitors',
      displayed: closest,
      actual: Math.min(3, competitors),
    },
    {
      label: 'platformsUsable',
      displayed: report.coverage.platformsUsable ?? usableLlms,
      actual: usableLlms,
    },
  ]);
}
