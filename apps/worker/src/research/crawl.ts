import { extractPageFromHtml } from './extract';
import { fetchPage, fetchTextResource } from './fetch';
import type { PageExtraction, ResearchCrawlResult, SiteTechnicalData } from './types';
import { MAX_RESEARCH_PAGES } from './types';
import { classifyPageType, normalizeUrl, priorityScore, sameHost, seedCandidatePaths } from './url';

function parseSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const loc = normalizeUrl(match[1].trim());
    if (loc) locs.push(loc);
  }
  return locs;
}

async function collectSiteTechnical(origin: string): Promise<SiteTechnicalData> {
  const robotsTxt = await fetchTextResource(new URL('/robots.txt', origin).toString());
  const sitemapCandidates = new Set<string>([
    new URL('/sitemap.xml', origin).toString(),
    new URL('/sitemap_index.xml', origin).toString(),
    new URL('/sitemap-index.xml', origin).toString(),
  ]);
  if (robotsTxt) {
    for (const line of robotsTxt.split(/\r?\n/)) {
      const m = line.match(/^\s*sitemap:\s*(.+)$/i);
      if (m?.[1]) {
        const loc = normalizeUrl(m[1].trim());
        if (loc) sitemapCandidates.add(loc);
      }
    }
  }

  const sitemapUrls: string[] = [];
  let sitemapXmlPreview: string | null = null;
  for (const sitemapUrl of sitemapCandidates) {
    const xml = await fetchTextResource(sitemapUrl);
    if (!xml) continue;
    if (!sitemapXmlPreview) sitemapXmlPreview = xml.slice(0, 20_000);
    const locs = parseSitemapLocs(xml);
    for (const loc of locs) {
      if (sameHost(loc, origin)) sitemapUrls.push(loc);
    }
    if (/<sitemapindex/i.test(xml)) {
      for (const child of locs.slice(0, 5)) {
        const childXml = await fetchTextResource(child);
        if (!childXml) continue;
        for (const loc of parseSitemapLocs(childXml)) {
          if (sameHost(loc, origin)) sitemapUrls.push(loc);
        }
      }
    }
  }

  return {
    robotsTxt,
    sitemapUrls: [...new Set(sitemapUrls)].slice(0, 500),
    sitemapXmlPreview,
    favicon: null,
  };
}

function emptyPage(url: string, fetched: Awaited<ReturnType<typeof fetchPage>>, isHomepage: boolean): PageExtraction {
  return {
    url,
    finalUrl: fetched.finalUrl || url,
    pageType: classifyPageType(url, isHomepage),
    statusCode: fetched.statusCode,
    redirectChain: fetched.redirectChain,
    loadTimeMs: fetched.loadTimeMs,
    ssl: fetched.ssl,
    error: fetched.error || 'Empty HTML',
    title: null,
    metaTitle: null,
    metaDescription: null,
    canonical: null,
    robotsMeta: null,
    openGraph: {},
    twitterCards: {},
    language: null,
    charset: null,
    viewport: null,
    favicon: null,
    headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
    paragraphs: [],
    images: [],
    lists: [],
    tables: [],
    buttons: [],
    ctaTexts: [],
    breadcrumbs: [],
    schemas: [],
    hasOrganizationSchema: false,
    hasFaqSchema: false,
    hasProductSchema: false,
    hasArticleSchema: false,
    hasBreadcrumbSchema: false,
    links: [],
    textExcerpt: null,
  };
}

export async function crawlWebsiteResearch(websiteUrl: string): Promise<ResearchCrawlResult> {
  const root = normalizeUrl(websiteUrl);
  if (!root) throw new Error('Invalid website URL');
  const origin = new URL(root).origin;
  const siteTechnical = await collectSiteTechnical(origin);
  const maxPages = Math.max(3, Math.min(50, Number(process.env.RESEARCH_MAX_PAGES || MAX_RESEARCH_PAGES) || 20));

  const queue: string[] = [];
  const enqueued = new Set<string>();
  const enqueue = (url: string | null | undefined) => {
    if (!url) return;
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    if (!sameHost(normalized, origin)) return;
    if (enqueued.has(normalized)) return;
    if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|css|js|mp4|mp3|xml)(\?|$)/i.test(normalized)) return;
    enqueued.add(normalized);
    queue.push(normalized);
  };

  enqueue(root);
  for (const seed of seedCandidatePaths(origin)) enqueue(seed);
  for (const loc of siteTechnical.sitemapUrls.slice(0, 80)) enqueue(loc);

  const pages: PageExtraction[] = [];
  const visited = new Set<string>();
  const engines = new Set<'playwright' | 'fetch'>();

  while (queue.length && pages.length < maxPages) {
    queue.sort(
      (a, b) =>
        priorityScore(b, b === root || new URL(b).pathname === '/') -
        priorityScore(a, a === root || new URL(a).pathname === '/'),
    );
    const next = queue.shift()!;
    if (visited.has(next)) continue;
    visited.add(next);

    const fetched = await fetchPage(next);
    engines.add(fetched.engine);
    const isHomepage = pages.length === 0 || new URL(fetched.finalUrl || next).pathname === '/';

    if (fetched.error || !fetched.html) {
      pages.push(emptyPage(next, fetched, isHomepage));
      continue;
    }

    const extracted = extractPageFromHtml({
      url: next,
      finalUrl: fetched.finalUrl,
      html: fetched.html,
      statusCode: fetched.statusCode,
      redirectChain: fetched.redirectChain,
      loadTimeMs: fetched.loadTimeMs,
      ssl: fetched.ssl,
      isHomepage,
    });
    if (!siteTechnical.favicon && extracted.favicon) siteTechnical.favicon = extracted.favicon;
    pages.push(extracted);
    for (const link of extracted.links) {
      if (link.kind === 'internal') enqueue(link.href);
    }
  }

  const engine: ResearchCrawlResult['engine'] =
    engines.size > 1 ? 'mixed' : engines.has('playwright') ? 'playwright' : 'fetch';

  return { pages, siteTechnical, pagesCrawled: pages.length, engine };
}
