import type { CrawlResult } from '../tools/crawl';
import type { LlmAnswer } from '../tools/llm';
import { detectMention } from '../tools/extract';
import { platformFromModel } from '../tools/platforms';
import { crawlWebsiteResearch } from '../research/crawl';
import { closeResearchBrowser } from '../research/fetch';
import type { ResearchCrawlResult } from '../research/types';
import { analyzeTechnical, scoreTechnical } from '../engines/technical/analyze';
import { analyzeAeo, scoreAeo } from '../engines/aeo/analyze';
import { analyzeGeo, scoreGeo } from '../engines/geo/analyze';
import { generateResearchPrompts } from '../llm-research/prompts';
import { buildEvidence, buildKnowledgeGraph, parseResearch } from '../llm-research/graph';
import { listResearchProviders, queryProvider } from '../providers/query';
import { env } from '../env';

export type Intake = {
  companyName?: string | null;
  businessDescription?: string | null;
  productsServices?: string | null;
  idealCustomers?: string | null;
  countries?: string | null;
  competitors?: string | null;
  aiPlatforms?: string[];
  marketingChallenge?: string | null;
};

export type PipelineArtifacts = {
  engine: string;
  pagesCrawled: number;
  pages: Array<{ url: string; pageType: string | null; title: string | null; statusCode: number }>;
  technicalScore: number;
  aeoScore: number;
  geoScore: number;
  prompts: string[];
  providers: string[];
  parsed: ReturnType<typeof parseResearch>;
  evidence: ReturnType<typeof buildEvidence>;
  graph: ReturnType<typeof buildKnowledgeGraph>;
};

export type PipelineResult = {
  crawl: CrawlResult;
  research: LlmAnswer[];
  artifacts: PipelineArtifacts;
  notes: string[];
};

function toCrawlResult(multi: ResearchCrawlResult, websiteUrl: string): CrawlResult {
  const home =
    multi.pages.find((p) => p.pageType === 'homepage') ||
    multi.pages.find((p) => {
      try {
        return new URL(p.finalUrl || p.url).pathname === '/';
      } catch {
        return false;
      }
    }) ||
    multi.pages[0];
  const host = (() => {
    try {
      return new URL(home?.finalUrl || websiteUrl).hostname.replace(/^www\./, '');
    } catch {
      return websiteUrl;
    }
  })();
  const allText = multi.pages.map((p) => p.textExcerpt || '').join(' ');
  const allTypes = [...new Set(multi.pages.flatMap((p) => p.schemas.map((s) => s.schemaType)))];
  const h1 = home?.headings.h1 || [];
  const h2 = home?.headings.h2 || [];
  const headings = [...h1, ...h2].slice(0, 28);
  const title = home?.title || host;
  const brandGuess = title.split(/[|\-–—]/)[0]?.trim() || host.split('.')[0] || host;
  const questionHeadings = multi.pages.reduce(
    (n, p) => n + [...p.headings.h1, ...p.headings.h2].filter((h) => /\?/.test(h)).length,
    0,
  );
  const imageCount = multi.pages.reduce((n, p) => n + p.images.length, 0);
  const imagesWithAlt = multi.pages.reduce((n, p) => n + p.images.filter((i) => i.alt?.trim()).length, 0);
  const internalLinkCount = multi.pages.reduce((n, p) => n + p.links.filter((l) => l.kind === 'internal').length, 0);
  const externalLinkCount = multi.pages.reduce((n, p) => n + p.links.filter((l) => l.kind === 'external').length, 0);
  const hasFaqSchema = multi.pages.some((p) => p.hasFaqSchema);
  const hasOrgSchema = multi.pages.some((p) => p.hasOrganizationSchema);
  const hasProductSchema = multi.pages.some((p) => p.hasProductSchema);
  const hasPersonSchema = allTypes.some((t) => /person/i.test(t));
  const hasLocalBusiness = allTypes.some((t) => /localbusiness/i.test(t));
  const robotsMeta = home?.robotsMeta || null;

  return {
    url: websiteUrl,
    finalUrl: home?.finalUrl || websiteUrl,
    title,
    description: home?.metaDescription || '',
    text: allText.slice(0, 14_000),
    headings,
    h1,
    h2,
    wordCount: allText.split(/\s+/).filter(Boolean).length,
    hasFaq: hasFaqSchema || /faq|frequently asked/i.test(allText) || questionHeadings >= 3,
    hasSchema: allTypes.length > 0,
    brandGuess,
    linkCount: internalLinkCount + externalLinkCount,
    canonical: home?.canonical || null,
    robotsMeta,
    robotsTxtFound: Boolean(multi.siteTechnical.robotsTxt),
    robotsAllowsIndexing: robotsMeta ? !/noindex/i.test(robotsMeta) : null,
    hasSitemap: multi.siteTechnical.sitemapUrls.length > 0 || Boolean(multi.siteTechnical.sitemapXmlPreview),
    ogTitle: home?.openGraph['og:title'] || null,
    ogDescription: home?.openGraph['og:description'] || null,
    imageCount,
    imagesWithAlt,
    schemaTypes: allTypes,
    hasProductSchema,
    hasOrgSchema,
    hasFaqSchema,
    hasPersonSchema,
    hasLocalBusiness,
    hasAbout: multi.pages.some((p) => p.pageType === 'about') || /\babout us\b/i.test(allText),
    hasContact: multi.pages.some((p) => p.pageType === 'contact') || /\bcontact us\b/i.test(allText),
    hasComparison: /\bvs\.?\b|\bversus\b|\balternative/i.test(allText),
    hasAuthor: hasPersonSchema || /\bwritten by\b|\bauthor\b/i.test(allText),
    hasLocation: hasLocalBusiness || /\bheadquarters|located in\b/i.test(allText),
    internalLinkCount,
    externalLinkCount,
    questionHeadings,
    host,
  };
}

export async function runVisibilityPipeline(params: {
  websiteUrl: string;
  brandHint: string;
  intake: Intake | null;
  onStep: (step: string, detail?: string) => Promise<void>;
}): Promise<PipelineResult> {
  const notes: string[] = [];
  await params.onStep('crawl');
  let multi: ResearchCrawlResult;
  try {
    multi = await crawlWebsiteResearch(params.websiteUrl);
    notes.push(`Crawled ${multi.pagesCrawled} pages via ${multi.engine}.`);
  } finally {
    await closeResearchBrowser().catch(() => undefined);
  }

  await params.onStep('technical');
  const technical = analyzeTechnical(multi);
  const technicalScore = scoreTechnical(technical);

  await params.onStep('aeo');
  const aeo = analyzeAeo(multi.pages, technical);
  const aeoScore = scoreAeo(aeo);

  await params.onStep('geo');
  const geo = analyzeGeo(multi.pages, technical, aeo);
  const geoScore = scoreGeo(geo);

  const crawl = toCrawlResult(multi, params.websiteUrl);
  const brand = crawl.brandGuess || params.intake?.companyName || params.brandHint;

  await params.onStep('prompts');
  const faqHeadings = multi.pages.flatMap((p) =>
    [...p.headings.h1, ...p.headings.h2, ...p.headings.h3].filter((h) => /\?/.test(h) || /^(what|how|why|when)\b/i.test(h)),
  );
  const prompts = generateResearchPrompts({
    brand,
    intake: params.intake,
    pageTitles: multi.pages.map((p) => p.title || '').filter(Boolean),
    faqHeadings,
    topics: [...new Set(geo.map((g) => g.primaryTopic))],
  });

  await params.onStep('research');
  const providers = listResearchProviders(params.intake?.aiPlatforms);
  const research: LlmAnswer[] = [];
  const maxPrompts = Math.max(4, Math.min(10, Number(env('RESEARCH_MAX_PROMPTS', '8')) || 8));
  const selected = prompts.slice(0, maxPrompts);
  const concurrency = Math.max(1, Number(env('LLM_RESEARCH_CONCURRENCY', '3')) || 3);

  if (!providers.length) {
    notes.push('No LLM providers configured; research skipped.');
  } else {
    notes.push(`Research providers: ${providers.map((p) => `${p.label}${p.native ? ' (native)' : ''}`).join(', ')}.`);
    for (const prompt of selected) {
      for (let i = 0; i < providers.length; i += concurrency) {
        const batch = providers.slice(i, i + concurrency);
        const hits = await Promise.all(
          batch.map(async (provider) => {
            try {
              const answer = await queryProvider(
                provider,
                `Answer clearly and name real companies when relevant. Include source URLs only if you know them.\n\n${prompt.prompt}`,
              );
              return {
                model: provider.model,
                platform: provider.label,
                question: prompt.prompt,
                answer,
                brandMentioned: detectMention(answer, brand),
              } satisfies LlmAnswer;
            } catch (err) {
              return {
                model: provider.model,
                platform: provider.label,
                question: prompt.prompt,
                answer: '',
                brandMentioned: false,
                error: err instanceof Error ? err.message : 'Provider failed',
              } satisfies LlmAnswer;
            }
          }),
        );
        research.push(...hits);
      }
      await params.onStep('research', prompt.prompt.slice(0, 80));
    }
  }

  await params.onStep('parse');
  const parsed = parseResearch(research, brand, params.intake?.competitors);

  await params.onStep('evidence');
  const evidence = buildEvidence(parsed);

  await params.onStep('graph');
  const graph = buildKnowledgeGraph(brand, parsed, params.intake?.competitors);

  const artifacts: PipelineArtifacts = {
    engine: multi.engine,
    pagesCrawled: multi.pagesCrawled,
    pages: multi.pages.map((p) => ({
      url: p.finalUrl || p.url,
      pageType: p.pageType,
      title: p.title,
      statusCode: p.statusCode,
    })),
    technicalScore,
    aeoScore,
    geoScore,
    prompts: selected.map((p) => p.prompt),
    providers: providers.map((p) => p.id),
    parsed,
    evidence,
    graph,
  };

  return { crawl, research, artifacts, notes };
}
