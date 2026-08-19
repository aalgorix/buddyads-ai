import type { CitationRef, Sentiment } from '../types/report';
import { isGenericCompetitorName, looksLikeProperNoun } from './report-integrity';

const STOP_ENTITIES = new Set(
  [
    'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'our', 'best',
    'top', 'here', 'there', 'what', 'when', 'how', 'why', 'who', 'which',
    'company', 'companies', 'brand', 'brands', 'product', 'products', 'service',
    'services', 'platform', 'platforms', 'solution', 'solutions', 'tool', 'tools',
    'website', 'site', 'agency', 'vendor', 'app', 'provider', 'system',
    'option', 'options', 'alternative', 'alternatives', 'example', 'examples',
    'chatgpt', 'gemini', 'claude', 'perplexity', 'openai', 'google', 'anthropic',
    'microsoft', 'copilot', 'wikipedia', 'reddit', 'forbes',
  ].map((s) => s.toLowerCase()),
);

export function parseNameList(raw?: string | null): string[] {
  if (!raw) return [];
  const parts = raw
    .split(/[,;|&/\n]+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 2 && s.length < 80);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export function detectMention(text: string, name: string): boolean {
  if (!text || !name) return false;
  const hay = text.toLowerCase();
  const needle = name.toLowerCase().trim();
  if (needle.length < 2) return false;
  if (hay.includes(needle)) return true;
  const token = needle.split(/\s+/)[0];
  if (token.length < 4) return false;
  const re = new RegExp(`\\b${escapeReg(token)}\\b`, 'i');
  return re.test(text);
}

export function extractCitations(answer: string): CitationRef[] {
  if (!answer) return [];
  const found = new Map<string, CitationRef>();

  const push = (raw: string) => {
    try {
      const cleaned = raw.replace(/[.,;:!?)]+$/, '');
      const url = new URL(cleaned);
      if (!['http:', 'https:'].includes(url.protocol)) return;
      const domain = url.hostname.replace(/^www\./, '').toLowerCase();
      if (!domain || found.has(domain + url.pathname)) return;
      found.set(domain + url.pathname, { url: url.toString(), domain });
    } catch {
      /* ignore */
    }
  };

  for (const m of answer.matchAll(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/gi)) {
    push(m[1]);
  }
  for (const m of answer.matchAll(/https?:\/\/[^\s)\]>'"]+/gi)) {
    push(m[0]);
  }

  return [...found.values()];
}

export function domainOfUrl(websiteUrl: string): string {
  try {
    return new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`)
      .hostname.replace(/^www\./, '')
      .toLowerCase();
  } catch {
    return websiteUrl.replace(/^www\./, '').toLowerCase();
  }
}

export function ownDomainCited(citations: CitationRef[], websiteUrl: string): boolean {
  const host = domainOfUrl(websiteUrl);
  if (!host) return false;
  return citations.some((c) => c.domain === host || c.domain.endsWith(`.${host}`));
}

export function firstMentionIndex(text: string, name: string): number {
  if (!text || !name) return -1;
  const hay = text.toLowerCase();
  const needle = name.toLowerCase().trim();
  const idx = hay.indexOf(needle);
  if (idx >= 0) return idx;
  const token = needle.split(/\s+/)[0];
  if (token.length < 4) return -1;
  const m = hay.match(new RegExp(`\\b${escapeReg(token)}\\b`));
  return m?.index ?? -1;
}

/**
 * Rank of the brand among named brands in the answer (1 = first named).
 * Returns null if the brand is not mentioned.
 */
export function brandPosition(
  answer: string,
  brand: string,
  otherBrands: string[],
): number | null {
  if (!detectMention(answer, brand)) return null;
  const names = uniqueNames([brand, ...otherBrands]);
  const hits = names
    .map((n) => ({ n, i: firstMentionIndex(answer, n) }))
    .filter((h) => h.i >= 0)
    .sort((a, b) => a.i - b.i);
  const idx = hits.findIndex((h) => namesEqual(h.n, brand));
  return idx >= 0 ? idx + 1 : null;
}

export function mentionedOf(answer: string, names: string[], exclude?: string): string[] {
  return uniqueNames(names).filter((n) => {
    if (exclude && namesEqual(n, exclude)) return false;
    return detectMention(answer, n);
  });
}

/**
 * Conservative extraction of other recommended brand-like names from lists.
 * Only used as observed brands — never as fabricated competitors.
 */
export function extractObservedBrands(answer: string, brand: string, known: string[]): string[] {
  if (!answer) return [];
  const out: string[] = [];
  const lines = answer.split(/\n+/);
  const lineRe =
    /^(?:\d+[\.\)]\s+|[-*•]\s+)([A-Z][A-Za-z0-9&.+\-]{1,40}(?:\s+[A-Z][A-Za-z0-9&.+\-]{1,40}){0,3})/;

  for (const line of lines) {
    const m = line.trim().match(lineRe);
    if (!m) continue;
    const name = m[1].replace(/[:–—-].*$/, '').trim();
    if (isPlausibleBrand(name, brand, known)) out.push(name);
  }

  const rec =
    /(?:recommend(?:s|ed)?|consider|look at|options include|such as)\s+([A-Z][A-Za-z0-9&.+\-]{1,40}(?:\s+[A-Z][A-Za-z0-9&.+\-]{1,40}){0,2})/g;
  for (const m of answer.matchAll(rec)) {
    const name = m[1].trim();
    if (isPlausibleBrand(name, brand, known)) out.push(name);
  }

  return uniqueNames(out).slice(0, 12);
}

export function inferSentiment(answer: string, brand: string): Sentiment | null {
  if (!detectMention(answer, brand)) return null;
  const sentences = answer.split(/(?<=[.!?])\s+/).filter((s) => detectMention(s, brand));
  if (!sentences.length) return null;

  const pos =
    /\b(recommend|recommended|best|leading|excellent|trusted|top|strong|standout|prefer|great|reliable|impressive)\b/i;
  const neg =
    /\b(avoid|poor|weak|limited|lacking|unfortunately|overpriced|issue|issues|problem|problems|not recommend|lagging|invisible|missing)\b/i;

  let p = 0;
  let n = 0;
  for (const s of sentences) {
    if (pos.test(s)) p += 1;
    if (neg.test(s)) n += 1;
  }
  if (p > 0 && n > 0) return 'mixed';
  if (p > 0) return 'positive';
  if (n > 0) return 'negative';
  return 'neutral';
}

export function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const t = n.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function namesEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function isPlausibleBrand(name: string, brand: string, known: string[]): boolean {
  if (!name || namesEqual(name, brand)) return false;
  if (known.some((k) => namesEqual(k, name))) return false;
  const words = name.split(/\s+/);
  if (words.some((w) => STOP_ENTITIES.has(w.toLowerCase()))) return false;
  if (isGenericCompetitorName(name)) return false;
  if (!looksLikeProperNoun(name)) return false;
  if (name.length < 3 || name.length > 48) return false;
  if (/^(In|On|At|To|As|If|We|It|An|A)$/i.test(words[0])) return false;
  return true;
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
