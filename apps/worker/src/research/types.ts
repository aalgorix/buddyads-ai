export const MAX_RESEARCH_PAGES = 20;

export const PRIORITY_PATH_HINTS = [
  { type: 'about', patterns: [/about/, /company/, /who-we-are/, /our-story/] },
  { type: 'services', patterns: [/service/, /what-we-do/] },
  { type: 'products', patterns: [/product/, /platform/, /features?/] },
  { type: 'solutions', patterns: [/solution/, /use-case/, /industries/] },
  { type: 'pricing', patterns: [/pricing/, /plans?/, /packages?/] },
  { type: 'contact', patterns: [/contact/, /get-in-touch/, /support/] },
  { type: 'blog', patterns: [/blog/, /news/, /articles?/, /insights?/] },
  { type: 'faq', patterns: [/faq/, /help/, /knowledge/] },
  { type: 'resources', patterns: [/resource/, /docs?/, /learn/, /guides?/] },
] as const;

export type PriorityPageType = (typeof PRIORITY_PATH_HINTS)[number]['type'] | 'homepage' | 'other';

export interface FetchedPage {
  url: string;
  finalUrl: string;
  statusCode: number;
  redirectChain: string[];
  loadTimeMs: number;
  html: string;
  ssl: boolean;
  error?: string;
  engine: 'playwright' | 'fetch';
}

export interface ExtractedImage {
  src: string;
  alt: string | null;
}

export interface ExtractedLinkItem {
  href: string;
  text: string | null;
  kind: 'internal' | 'external';
}

export interface PageExtraction {
  url: string;
  finalUrl: string;
  pageType: PriorityPageType;
  statusCode: number;
  redirectChain: string[];
  loadTimeMs: number;
  ssl: boolean;
  error?: string;
  title: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  openGraph: Record<string, string>;
  twitterCards: Record<string, string>;
  language: string | null;
  charset: string | null;
  viewport: string | null;
  favicon: string | null;
  headings: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', string[]>;
  paragraphs: string[];
  images: ExtractedImage[];
  lists: string[][];
  tables: string[][];
  buttons: string[];
  ctaTexts: string[];
  breadcrumbs: string[];
  schemas: Array<{ schemaType: string; jsonLd: unknown }>;
  hasOrganizationSchema: boolean;
  hasFaqSchema: boolean;
  hasProductSchema: boolean;
  hasArticleSchema: boolean;
  hasBreadcrumbSchema: boolean;
  links: ExtractedLinkItem[];
  textExcerpt: string | null;
}

export interface SiteTechnicalData {
  robotsTxt: string | null;
  sitemapUrls: string[];
  sitemapXmlPreview: string | null;
  favicon: string | null;
}

export interface ResearchCrawlResult {
  pages: PageExtraction[];
  siteTechnical: SiteTechnicalData;
  pagesCrawled: number;
  engine: 'playwright' | 'fetch' | 'mixed';
}
