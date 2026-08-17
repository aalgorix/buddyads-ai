import type { FetchedPage } from './types';
import { assertSafeUrl } from './ssrf';

const USER_AGENT = 'BuddyAdsResearchBot/1.0 (+https://buddyads.agency; Website Research Engine)';
const NAV_TIMEOUT_MS = 25_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedBrowser: any = null;

async function getBrowser() {
  if (sharedBrowser?.isConnected?.()) return sharedBrowser;
  const { chromium } = await import('playwright');
  sharedBrowser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  return sharedBrowser;
}

export async function closeResearchBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => undefined);
    sharedBrowser = null;
  }
}

export async function fetchPageWithPlaywright(url: string): Promise<FetchedPage> {
  const started = Date.now();
  const safe = await assertSafeUrl(url);
  const target = safe.toString();

  try {
    const browser = await getBrowser();
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      ignoreHTTPSErrors: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    const redirectChain: string[] = [];

    page.on('response', (response: { request: () => { isNavigationRequest: () => boolean }; url: () => string }) => {
      const req = response.request();
      if (req.isNavigationRequest() && response.url()) redirectChain.push(response.url());
    });

    const response = await page.goto(target, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    });
    await new Promise((r) => setTimeout(r, 800));

    const finalUrl = page.url();
    await assertSafeUrl(finalUrl);
    const html = await page.content();
    const statusCode = response?.status() ?? 0;
    await context.close();

    return {
      url: target,
      finalUrl,
      statusCode,
      redirectChain: [...new Set(redirectChain)].slice(0, 20),
      loadTimeMs: Date.now() - started,
      html,
      ssl: finalUrl.startsWith('https:'),
      engine: 'playwright',
    };
  } catch (err) {
    return {
      url: target,
      finalUrl: target,
      statusCode: 0,
      redirectChain: [],
      loadTimeMs: Date.now() - started,
      html: '',
      ssl: target.startsWith('https:'),
      error: err instanceof Error ? err.message : 'Playwright fetch failed',
      engine: 'playwright',
    };
  }
}

export async function fetchPageWithHttp(url: string): Promise<FetchedPage> {
  const started = Date.now();
  const safe = await assertSafeUrl(url);
  const target = safe.toString();
  try {
    const res = await fetch(target, {
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(NAV_TIMEOUT_MS),
    });
    const finalUrl = res.url || target;
    await assertSafeUrl(finalUrl);
    const html = await res.text();
    return {
      url: target,
      finalUrl,
      statusCode: res.status,
      redirectChain: finalUrl === target ? [target] : [target, finalUrl],
      loadTimeMs: Date.now() - started,
      html: html.slice(0, 1_500_000),
      ssl: finalUrl.startsWith('https:'),
      engine: 'fetch',
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      url: target,
      finalUrl: target,
      statusCode: 0,
      redirectChain: [],
      loadTimeMs: Date.now() - started,
      html: '',
      ssl: target.startsWith('https:'),
      error: err instanceof Error ? err.message : 'Fetch failed',
      engine: 'fetch',
    };
  }
}

export async function fetchPage(url: string): Promise<FetchedPage> {
  const preferFetch = ['1', 'true', 'on'].includes((process.env.RESEARCH_FETCH_ONLY || '').toLowerCase());
  if (!preferFetch) {
    try {
      const pw = await fetchPageWithPlaywright(url);
      if (pw.html && !pw.error) return pw;
    } catch {
      /* fall through */
    }
  }
  return fetchPageWithHttp(url);
}

export async function fetchTextResource(url: string): Promise<string | null> {
  try {
    await assertSafeUrl(url);
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain,*/*' },
    });
    if (!res.ok) return null;
    return (await res.text()).slice(0, 500_000);
  } catch {
    return null;
  }
}
