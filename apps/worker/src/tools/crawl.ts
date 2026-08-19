import * as cheerio from 'cheerio';

export type CrawlResult = {
  url: string;
  finalUrl: string;
  title: string;
  description: string;
  text: string;
  headings: string[];
  h1: string[];
  h2: string[];
  wordCount: number;
  hasFaq: boolean;
  hasSchema: boolean;
  brandGuess: string;
  linkCount: number;
  canonical: string | null;
  robotsMeta: string | null;
  robotsTxtFound: boolean | null;
  robotsAllowsIndexing: boolean | null;
  hasSitemap: boolean | null;
  ogTitle: string | null;
  ogDescription: string | null;
  imageCount: number;
  imagesWithAlt: number;
  schemaTypes: string[];
  hasProductSchema: boolean;
  hasOrgSchema: boolean;
  hasFaqSchema: boolean;
  hasPersonSchema: boolean;
  hasLocalBusiness: boolean;
  hasAbout: boolean;
  hasContact: boolean;
  hasComparison: boolean;
  hasAuthor: boolean;
  hasLocation: boolean;
  internalLinkCount: number;
  externalLinkCount: number;
  questionHeadings: number;
  host: string;
};

function brandFromTitle(title: string, host: string): string {
  const cleaned = title.split(/[|\-–—]/)[0]?.trim() || '';
  if (cleaned.length >= 2 && cleaned.length < 80) return cleaned;
  return host.replace(/^www\./, '').split('.')[0] || host;
}

function schemaTypesFromJson(raw: string): string[] {
  const types: string[] = [];
  const walk = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      const t = obj['@type'];
      if (typeof t === 'string') types.push(t);
      else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.push(x));
      Object.values(obj).forEach(walk);
    }
  };
  try {
    walk(JSON.parse(raw));
  } catch {
    const m = raw.match(/"@type"\s*:\s*"([^"]+)"/g);
    if (m) {
      for (const x of m) {
        const t = x.match(/"([^"]+)"$/);
        if (t?.[1]) types.push(t[1]);
      }
    }
  }
  return types;
}

async function probe(url: string): Promise<boolean | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'BuddyAdsVisibilityAgent/0.1 (+research)', Accept: 'text/plain, application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.status === 404) return false;
    if (!res.ok) return null;
    const text = await res.text();
    return text.trim().length > 10;
  } catch {
    return null;
  }
}

export async function crawlWebsite(websiteUrl: string): Promise<CrawlResult> {
  let url = websiteUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed');
  }

  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'BuddyAdsVisibilityAgent/0.1 (+research)',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) throw new Error(`Crawl failed: HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const origin = new URL(res.url || url).origin;
  const host = new URL(res.url || url).hostname.replace(/^www\./, '');

  const title = $('title').first().text().trim() || parsed.hostname;
  const description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    '';

  const h1 = $('h1')
    .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean)
    .slice(0, 8);
  const h2 = $('h2')
    .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean)
    .slice(0, 24);
  const headings = [...h1, ...h2].slice(0, 28);
  const questionHeadings = headings.filter((h) => /\?/.test(h) || /^(what|why|how|when|where|who|which)\b/i.test(h)).length;

  $('script:not([type="application/ld+json"]), style, noscript, svg').remove();
  const text = $('body')
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 14_000);

  const ldJson = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => $(el).html() || '');
  const schemaTypes = [...new Set(ldJson.flatMap(schemaTypesFromJson))];
  const typeBlob = schemaTypes.join(' ').toLowerCase();
  const hasFaqSchema =
    schemaTypes.some((t) => /faqpage/i.test(t)) || $('[itemtype*="FAQPage"]').length > 0;
  const hasProductSchema = /product|service|softwareapplication/i.test(typeBlob);
  const hasOrgSchema = /organization|corporation|localbusiness/i.test(typeBlob);
  const hasPersonSchema = /person/i.test(typeBlob);
  const hasLocalBusiness = /localbusiness/i.test(typeBlob);

  const hasFaq =
    /faq|frequently asked/i.test(text) ||
    questionHeadings >= 3;

  const canonical =
    $('link[rel="canonical"]').attr('href')?.trim() ||
    $('meta[property="og:url"]').attr('content')?.trim() ||
    null;
  const robotsMeta =
    $('meta[name="robots"]').attr('content')?.trim() ||
    $('meta[name="googlebot"]').attr('content')?.trim() ||
    null;
  const robotsAllowsIndexing = robotsMeta
    ? !/noindex/i.test(robotsMeta)
    : null;

  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || null;
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || null;

  const images = $('img').toArray();
  const imageCount = images.length;
  const imagesWithAlt = images.filter((el) => Boolean($(el).attr('alt')?.trim())).length;

  let internalLinkCount = 0;
  let externalLinkCount = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      const abs = new URL(href, origin);
      if (abs.hostname.replace(/^www\./, '') === host) internalLinkCount += 1;
      else if (['http:', 'https:'].includes(abs.protocol)) externalLinkCount += 1;
    } catch {
      internalLinkCount += 1;
    }
  });

  const hasAbout = /\/about\b|\babout us\b|\bour story\b|\bwho we are\b/i.test(text + ' ' + html.slice(0, 80_000));
  const hasContact = /\/contact\b|\bcontact us\b|\bget in touch\b/i.test(text + ' ' + html.slice(0, 80_000));
  const hasComparison = /\bvs\.?\b|\bversus\b|\balternative(s)?\b|\bcompar(e|ison)\b/i.test(text);
  const hasAuthor =
    hasPersonSchema ||
    /rel=["']author["']|itemprop=["']author["']|\bbyline\b|\bwritten by\b|\bauthor\b/i.test(html.slice(0, 80_000));
  const hasLocation =
    hasLocalBusiness ||
    Boolean($('[itemprop="address"], .address, address').length) ||
    /\b(united states|usa|uk|india|uae|canada|australia|london|new york|dubai|singapore)\b/i.test(text);

  const [robotsTxtFound, hasSitemap] = await Promise.all([
    probe(`${origin}/robots.txt`),
    probe(`${origin}/sitemap.xml`),
  ]);

  return {
    url,
    finalUrl: res.url || url,
    title,
    description,
    text,
    headings,
    h1,
    h2,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    hasFaq,
    hasSchema: ldJson.length > 0 || $('[itemtype]').length > 0,
    brandGuess: brandFromTitle(title, host),
    linkCount: internalLinkCount + externalLinkCount,
    canonical,
    robotsMeta,
    robotsTxtFound,
    robotsAllowsIndexing,
    hasSitemap,
    ogTitle,
    ogDescription,
    imageCount,
    imagesWithAlt,
    schemaTypes,
    hasProductSchema,
    hasOrgSchema,
    hasFaqSchema,
    hasPersonSchema,
    hasLocalBusiness,
    hasAbout,
    hasContact,
    hasComparison,
    hasAuthor,
    hasLocation,
    internalLinkCount,
    externalLinkCount,
    questionHeadings,
    host,
  };
}
