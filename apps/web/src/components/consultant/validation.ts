import type { ConsultantPlatformId } from './types';
import { AI_PLATFORM_OPTIONS } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeWebsiteUrl(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return '';
  return cleaned.startsWith('http://') || cleaned.startsWith('https://')
    ? cleaned
    : `https://${cleaned}`;
}

export function validateWebsiteUrl(raw: string): { valid: true; url: string } | { valid: false; error: string } {
  const value = raw.trim();
  if (!value) {
    return { valid: false, error: 'Please share your website URL to continue.' };
  }

  const withProtocol = normalizeWebsiteUrl(value);

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return { valid: false, error: 'That does not look like a valid website URL. Example: https://yourcompany.com' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: 'Website URL must start with http:// or https://' };
  }

  if (!parsed.hostname.includes('.')) {
    return { valid: false, error: 'Please include a full domain, for example yourcompany.com' };
  }

  return { valid: true, url: parsed.toString().replace(/\/$/, '') };
}

export function validateEmail(raw: string): { valid: true; email: string } | { valid: false; error: string } {
  const email = raw.trim().toLowerCase();
  if (!email) {
    return { valid: false, error: 'A business email is required so we can send your report.' };
  }
  if (!EMAIL_RE.test(email)) {
    return { valid: false, error: 'Please enter a valid business email address.' };
  }
  return { valid: true, email };
}

export function parsePlatforms(raw: string | string[]): ConsultantPlatformId[] {
  const tokens = Array.isArray(raw)
    ? raw
    : raw.split(/[,&/]| and /i).map((t) => t.trim()).filter(Boolean);

  const matched = new Set<ConsultantPlatformId>();
  for (const token of tokens) {
    const lower = token.toLowerCase();
    for (const opt of AI_PLATFORM_OPTIONS) {
      if (lower.includes(opt.id) || lower.includes(opt.label.toLowerCase())) {
        matched.add(opt.id);
      }
    }
    if (lower.includes('gpt')) matched.add('chatgpt');
    if (lower.includes('openai')) matched.add('chatgpt');
    if (lower.includes('bing')) matched.add('copilot');
  }

  return [...matched];
}

export function isBlankOptional(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return !v || ['skip', 'n/a', 'na', 'none', 'no', '-'].includes(v);
}
