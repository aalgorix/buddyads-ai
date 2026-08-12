import * as cheerio from 'cheerio';

export type CrawlResult = {
  url: string;
  finalUrl: string;
  title: string;
  description: string;
  text: string;
  headings: string[];
  wordCount: number;
  hasFaq: boolean;
  hasSchema: boolean;
  brandGuess: string;
  linkCount: number;
};

function brandFromTitle(title: string, host: string): string {
  const cleaned = title.split(/[|\-–—]/)[0]?.trim() || '';
  if (cleaned.length >= 2 && cleaned.length < 80) return cleaned;
  return host.replace(/^www\./, '').split('.')[0] || host;
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
  $('script, style, noscript, svg').remove();

  const title = $('title').first().text().trim() || parsed.hostname;
  const description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    '';

  const headings = $('h1, h2')
    .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean)
    .slice(0, 20);

  const text = $('body')
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12_000);

  const hasFaq =
    /faq|frequently asked/i.test(text) ||
    $('[itemtype*="FAQPage"]').length > 0 ||
    $('script[type="application/ld+json"]')
      .toArray()
      .some((el) => /FAQPage/i.test($(el).html() || ''));

  const hasSchema = $('script[type="application/ld+json"]').length > 0;
  const linkCount = $('a[href]').length;

  return {
    url,
    finalUrl: res.url || url,
    title,
    description,
    text,
    headings,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    hasFaq,
    hasSchema,
    brandGuess: brandFromTitle(title, parsed.hostname),
    linkCount,
  };
}
