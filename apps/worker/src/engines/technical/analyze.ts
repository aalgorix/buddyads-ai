import type { ResearchCrawlResult } from '../../research/types';
import type { SiteTechnicalContext, TechnicalPageFindings } from './types';

type HeadingMap = Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', string[]>;

function pagePath(url: string): string {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return url;
  }
}

function normalizeHref(href: string): string {
  try {
    const u = new URL(href);
    u.hash = '';
    let out = u.toString();
    if (out.endsWith('/') && u.pathname !== '/') out = out.slice(0, -1);
    return out;
  } catch {
    return href;
  }
}

function headingHierarchy(headings: HeadingMap) {
  const levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
  const counts = {
    h1: headings.h1.length,
    h2: headings.h2.length,
    h3: headings.h3.length,
    h4: headings.h4.length,
    h5: headings.h5.length,
    h6: headings.h6.length,
  };
  const missingLevels: string[] = [];
  if (counts.h1 === 0) missingLevels.push('h1');
  let valid = counts.h1 > 0;
  let maxSeen = counts.h1 > 0 ? 1 : 0;
  for (let i = 1; i < levels.length; i++) {
    const level = i + 1;
    const tag = levels[i];
    if (counts[tag] > 0) {
      if (maxSeen === 0 || level > maxSeen + 1) {
        valid = false;
        for (let skip = maxSeen + 1; skip < level; skip++) missingLevels.push(`h${skip}`);
      }
      maxSeen = Math.max(maxSeen, level);
    }
  }
  if (levels.every((l) => counts[l] === 0)) {
    valid = false;
    missingLevels.push('h1', 'h2', 'h3');
  }
  return { valid, missingLevels: [...new Set(missingLevels)], counts };
}

function schemaFlags(schemas: Array<{ schemaType: string; jsonLd: unknown }>) {
  const types = new Set<string>();
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const obj = node as Record<string, unknown>;
    const t = obj['@type'];
    if (typeof t === 'string') types.add(t.toLowerCase());
    if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x.toLowerCase()));
    Object.values(obj).forEach(walk);
  };
  for (const schema of schemas) {
    if (schema.schemaType) types.add(schema.schemaType.toLowerCase());
    walk(schema.jsonLd);
  }
  const joined = [...types];
  const has = (...needles: string[]) => needles.some((n) => joined.some((t) => t === n || t.includes(n)));
  return {
    schemaTypes: [...types].sort(),
    organizationSchema: has('organization', 'corporation'),
    faqSchema: has('faqpage', 'question'),
    articleSchema: has('article', 'blogposting', 'newsarticle'),
    productSchema: has('product', 'offer'),
    breadcrumbSchema: has('breadcrumblist'),
    localBusinessSchema: has('localbusiness'),
    personSchema: has('person'),
    eventSchema: has('event'),
  };
}

export function extractSiteTechnicalContext(crawl: ResearchCrawlResult): SiteTechnicalContext {
  const homepage =
    crawl.pages.find((p) => p.pageType === 'homepage') ||
    crawl.pages.find((p) => pagePath(p.finalUrl || p.url) === '/') ||
    crawl.pages[0];
  return {
    hasRobotsTxt: Boolean(crawl.siteTechnical.robotsTxt?.trim()),
    hasSitemap: crawl.siteTechnical.sitemapUrls.length > 0 || Boolean(crawl.siteTechnical.sitemapXmlPreview),
    favicon: crawl.siteTechnical.favicon || homepage?.favicon || null,
  };
}

export function analyzeTechnical(crawl: ResearchCrawlResult): TechnicalPageFindings[] {
  const site = extractSiteTechnicalContext(crawl);
  const crawledUrlSet = new Set(crawl.pages.map((p) => normalizeHref(p.finalUrl || p.url)));
  const crawlStatusByUrl = new Map(
    crawl.pages.map((p) => [
      normalizeHref(p.finalUrl || p.url),
      { statusCode: p.statusCode, error: p.error || null },
    ]),
  );
  const inboundInternalCounts = new Map<string, number>();
  for (const page of crawl.pages) {
    for (const link of page.links.filter((l) => l.kind === 'internal')) {
      const href = normalizeHref(link.href);
      inboundInternalCounts.set(href, (inboundInternalCounts.get(href) || 0) + 1);
    }
  }

  return crawl.pages.map((page) => {
    const url = page.finalUrl || page.url;
    const path = pagePath(url);
    const titleText = page.title || page.metaTitle || '';
    const metaDescription = page.metaDescription || '';
    const hierarchy = headingHierarchy(page.headings);
    let missingAlt = 0;
    let emptyAlt = 0;
    for (const img of page.images) {
      if (img.alt == null) missingAlt += 1;
      else if (!String(img.alt).trim()) emptyAlt += 1;
    }
    const internalLinks = page.links.filter((l) => l.kind === 'internal');
    const brokenUrls: string[] = [];
    for (const link of internalLinks) {
      const href = normalizeHref(link.href);
      const hit = crawlStatusByUrl.get(href);
      if (!hit) continue;
      if (hit.error || (hit.statusCode != null && hit.statusCode >= 400)) brokenUrls.push(href);
    }
    const inbound = inboundInternalCounts.get(normalizeHref(url)) || 0;
    const isHomepage = page.pageType === 'homepage' || path === '/';
    const schema = schemaFlags(page.schemas);
    return {
      page: path,
      url,
      pageType: page.pageType,
      title: Boolean(titleText.trim()),
      titleLength: titleText.trim().length,
      metaDescription: Boolean(metaDescription.trim()),
      metaDescriptionLength: metaDescription.trim().length,
      canonical: Boolean(page.canonical?.trim()),
      openGraph: Object.keys(page.openGraph).length > 0,
      openGraphTagCount: Object.keys(page.openGraph).length,
      twitterCards: Object.keys(page.twitterCards).length > 0,
      twitterCardTagCount: Object.keys(page.twitterCards).length,
      h1: hierarchy.counts.h1 > 0,
      h1Count: hierarchy.counts.h1,
      multipleH1: hierarchy.counts.h1 > 1,
      headingHierarchyValid: hierarchy.valid,
      missingHeadingLevels: hierarchy.missingLevels,
      headingCounts: hierarchy.counts,
      imageCount: page.images.length,
      missingAltImages: missingAlt,
      emptyAltImages: emptyAlt,
      internalLinkCount: internalLinks.length,
      externalLinkCount: page.links.filter((l) => l.kind === 'external').length,
      brokenInternalLinks: brokenUrls.length,
      brokenInternalLinkUrls: [...new Set(brokenUrls)].slice(0, 50),
      orphanPage: !isHomepage && inbound === 0 && crawledUrlSet.size > 1,
      https: page.ssl || url.startsWith('https:'),
      redirects: page.redirectChain.length > 1,
      redirectCount: Math.max(0, page.redirectChain.length - 1),
      statusCode: page.statusCode,
      viewport: Boolean(page.viewport?.trim()),
      charset: Boolean(page.charset?.trim()),
      language: Boolean(page.language?.trim()),
      favicon: Boolean(page.favicon?.trim() || site.favicon),
      robots: site.hasRobotsTxt,
      sitemap: site.hasSitemap,
      loadTimeMs: page.loadTimeMs,
      crawlError: page.error || null,
      ...schema,
    };
  });
}

export function scoreTechnical(findings: TechnicalPageFindings[]): number {
  if (!findings.length) return 30;
  const rows = findings.map((f) => {
    let n = 20;
    if (f.title) n += 8;
    if (f.metaDescription) n += 8;
    if (f.canonical) n += 6;
    if (f.openGraph) n += 5;
    if (f.h1 && !f.multipleH1) n += 8;
    if (f.headingHierarchyValid) n += 6;
    if (f.https) n += 6;
    if (f.robots) n += 6;
    if (f.sitemap) n += 6;
    if (f.viewport) n += 3;
    if (f.organizationSchema) n += 6;
    if (f.faqSchema) n += 4;
    if (f.productSchema) n += 4;
    if (f.imageCount && f.missingAltImages / f.imageCount < 0.3) n += 4;
    if (f.orphanPage) n -= 8;
    if (f.brokenInternalLinks) n -= Math.min(10, f.brokenInternalLinks * 2);
    if (f.crawlError) n -= 12;
    return Math.max(0, Math.min(100, n));
  });
  const homepage = findings.find((f) => f.pageType === 'homepage' || f.page === '/') || findings[0];
  const homeScore = homepage
    ? rows[findings.indexOf(homepage)]
    : rows.reduce((a, b) => a + b, 0) / rows.length;
  const avg = rows.reduce((a, b) => a + b, 0) / rows.length;
  return Math.round(homeScore * 0.55 + avg * 0.45);
}
