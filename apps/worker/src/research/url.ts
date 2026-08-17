import type { PriorityPageType } from './types';
import { PRIORITY_PATH_HINTS } from './types';

export function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const url = base ? new URL(raw, base) : new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach(
      (key) => url.searchParams.delete(key),
    );
    let href = url.toString();
    if (href.endsWith('/') && url.pathname !== '/') href = href.slice(0, -1);
    return href;
  } catch {
    return null;
  }
}

export function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).hostname.replace(/^www\./, '') === new URL(b).hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
}

export function classifyPageType(url: string, isHomepage: boolean): PriorityPageType {
  if (isHomepage) return 'homepage';
  try {
    const path = new URL(url).pathname.toLowerCase();
    for (const hint of PRIORITY_PATH_HINTS) {
      if (hint.patterns.some((re) => re.test(path))) return hint.type;
    }
  } catch {
    /* ignore */
  }
  return 'other';
}

export function priorityScore(url: string, isHomepage: boolean): number {
  if (isHomepage) return 1000;
  const type = classifyPageType(url, false);
  const order = [
    'about',
    'services',
    'products',
    'solutions',
    'pricing',
    'contact',
    'faq',
    'blog',
    'resources',
    'other',
  ];
  const idx = order.indexOf(type);
  return 900 - (idx === -1 ? 800 : idx * 50);
}

export function seedCandidatePaths(origin: string): string[] {
  const paths = [
    '/',
    '/about',
    '/about-us',
    '/company',
    '/services',
    '/products',
    '/solutions',
    '/pricing',
    '/contact',
    '/contact-us',
    '/blog',
    '/faq',
    '/faqs',
    '/resources',
  ];
  return paths.map((p) => normalizeUrl(new URL(p, origin).toString())!).filter(Boolean);
}
