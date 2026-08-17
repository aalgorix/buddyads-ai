import * as cheerio from 'cheerio';
import type { PageExtraction, PriorityPageType } from './types';
import { classifyPageType, normalizeUrl, sameHost } from './url';

function metaContent($: cheerio.CheerioAPI, selectors: string[]): string | null {
  for (const sel of selectors) {
    const value = $(sel).attr('content')?.trim();
    if (value) return value;
  }
  return null;
}

function collectAttrMap($: cheerio.CheerioAPI, selector: string, keyAttr: string): Record<string, string> {
  const out: Record<string, string> = {};
  $(selector).each((_, el) => {
    const key = $(el).attr(keyAttr)?.trim();
    const content = $(el).attr('content')?.trim();
    if (key && content) out[key] = content;
  });
  return out;
}

function walkSchemaTypes(node: unknown, acc: Set<string>) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item) => walkSchemaTypes(item, acc));
    return;
  }
  const obj = node as Record<string, unknown>;
  const type = obj['@type'];
  if (typeof type === 'string') acc.add(type);
  if (Array.isArray(type)) type.forEach((t) => typeof t === 'string' && acc.add(t));
  Object.values(obj).forEach((v) => walkSchemaTypes(v, acc));
}

function primarySchemaType(node: unknown): string {
  if (!node || typeof node !== 'object') return 'Unknown';
  const obj = Array.isArray(node) ? (node[0] as Record<string, unknown>) : (node as Record<string, unknown>);
  const type = obj?.['@type'];
  if (typeof type === 'string') return type;
  if (Array.isArray(type) && typeof type[0] === 'string') return type[0];
  return 'Unknown';
}

const CTA_RE =
  /\b(get started|book|schedule|contact|demo|try|buy|subscribe|sign up|start free|request|talk to|learn more|download)\b/i;

export function extractPageFromHtml(params: {
  url: string;
  finalUrl: string;
  html: string;
  statusCode: number;
  redirectChain: string[];
  loadTimeMs: number;
  ssl: boolean;
  isHomepage: boolean;
  pageType?: PriorityPageType;
  error?: string;
}): PageExtraction {
  const $ = cheerio.load(params.html);
  $('script:not([type*="ld+json"]), style, noscript, iframe').remove();

  const title = $('title').first().text().replace(/\s+/g, ' ').trim() || null;
  const metaTitle = metaContent($, ['meta[property="og:title"]', 'meta[name="twitter:title"]']) || title;
  const metaDescription = metaContent($, [
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
  ]);
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || null;
  const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || null;
  const openGraph = collectAttrMap($, 'meta[property^="og:"]', 'property');
  const twitterCards = collectAttrMap($, 'meta[name^="twitter:"]', 'name');
  const language =
    $('html').attr('lang')?.trim() ||
    metaContent($, ['meta[http-equiv="content-language"]', 'meta[name="language"]']);
  const charset =
    $('meta[charset]').attr('charset')?.trim() ||
    $('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^\s;]+)/i)?.[1] ||
    null;
  const viewport = $('meta[name="viewport"]').attr('content')?.trim() || null;
  const favicon =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel="apple-touch-icon"]').attr('href') ||
    null;

  const headings = {
    h1: [] as string[],
    h2: [] as string[],
    h3: [] as string[],
    h4: [] as string[],
    h5: [] as string[],
    h6: [] as string[],
  };
  (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).forEach((tag) => {
    $(tag).each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) headings[tag].push(text);
    });
  });

  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length >= 20) paragraphs.push(text);
  });

  const images = $('img')
    .toArray()
    .map((el) => ({
      src: $(el).attr('src')?.trim() || '',
      alt: $(el).attr('alt')?.trim() || null,
    }))
    .filter((img) => img.src)
    .slice(0, 200);

  const lists: string[][] = [];
  $('ul, ol').each((_, el) => {
    const items: string[] = [];
    $(el)
      .find('> li')
      .each((__, li) => {
        const text = $(li).text().replace(/\s+/g, ' ').trim();
        if (text) items.push(text);
      });
    if (items.length) lists.push(items.slice(0, 50));
  });

  const tables: string[][] = [];
  $('table').each((_, table) => {
    const rows: string[] = [];
    $(table)
      .find('tr')
      .each((__, tr) => {
        const cells = $(tr)
          .find('th, td')
          .toArray()
          .map((cell) => $(cell).text().replace(/\s+/g, ' ').trim())
          .filter(Boolean);
        if (cells.length) rows.push(cells.join(' | '));
      });
    if (rows.length) tables.push(rows.slice(0, 40));
  });

  const buttons: string[] = [];
  $('button, [role="button"], input[type="submit"], input[type="button"]').each((_, el) => {
    const text =
      $(el).text().replace(/\s+/g, ' ').trim() ||
      $(el).attr('value')?.trim() ||
      $(el).attr('aria-label')?.trim() ||
      '';
    if (text) buttons.push(text);
  });

  const ctaTexts: string[] = [];
  $('a, button').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && CTA_RE.test(text)) ctaTexts.push(text);
  });

  const breadcrumbs: string[] = [];
  $('[itemtype*="BreadcrumbList"] [itemprop="name"], nav[aria-label*="breadcrumb" i] a, .breadcrumb a').each(
    (_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) breadcrumbs.push(text);
    },
  );

  const schemas: Array<{ schemaType: string; jsonLd: unknown }> = [];
  const allTypes = new Set<string>();
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw?.trim()) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      walkSchemaTypes(parsed, allTypes);
      const blocks = Array.isArray(parsed) ? parsed : [parsed];
      for (const block of blocks) {
        schemas.push({ schemaType: primarySchemaType(block), jsonLd: block });
      }
    } catch {
      /* ignore */
    }
  });

  const typeStr = [...allTypes].join(' ').toLowerCase();
  const hasOrganizationSchema = /organization|localbusiness|corporation/.test(typeStr);
  const hasFaqSchema = typeStr.includes('faqpage') || typeStr.includes('question');
  const hasProductSchema = typeStr.includes('product') || typeStr.includes('offer');
  const hasArticleSchema = /article|blogposting|newsarticle/.test(typeStr);
  const hasBreadcrumbSchema = typeStr.includes('breadcrumblist');

  const links: PageExtraction['links'] = [];
  const seen = new Set<string>();
  $('a[href]').each((_, el) => {
    const hrefRaw = $(el).attr('href')?.trim();
    if (!hrefRaw || hrefRaw.startsWith('#') || hrefRaw.startsWith('mailto:') || hrefRaw.startsWith('tel:')) {
      return;
    }
    const abs = normalizeUrl(hrefRaw, params.finalUrl);
    if (!abs || seen.has(abs)) return;
    seen.add(abs);
    const kind = sameHost(abs, params.finalUrl) ? 'internal' : 'external';
    links.push({
      href: abs,
      text: $(el).text().replace(/\s+/g, ' ').trim() || null,
      kind,
    });
  });

  const textExcerpt =
    $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000) || null;

  return {
    url: params.url,
    finalUrl: params.finalUrl,
    pageType: params.pageType || classifyPageType(params.finalUrl, params.isHomepage),
    statusCode: params.statusCode,
    redirectChain: params.redirectChain,
    loadTimeMs: params.loadTimeMs,
    ssl: params.ssl,
    error: params.error,
    title,
    metaTitle,
    metaDescription,
    canonical,
    robotsMeta,
    openGraph,
    twitterCards,
    language,
    charset,
    viewport,
    favicon: favicon ? normalizeUrl(favicon, params.finalUrl) : null,
    headings,
    paragraphs: paragraphs.slice(0, 120),
    images,
    lists: lists.slice(0, 40),
    tables: tables.slice(0, 20),
    buttons: [...new Set(buttons)].slice(0, 80),
    ctaTexts: [...new Set(ctaTexts)].slice(0, 80),
    breadcrumbs: [...new Set(breadcrumbs)].slice(0, 30),
    schemas: schemas.slice(0, 40),
    hasOrganizationSchema,
    hasFaqSchema,
    hasProductSchema,
    hasArticleSchema,
    hasBreadcrumbSchema,
    links: links.slice(0, 300),
    textExcerpt,
  };
}
