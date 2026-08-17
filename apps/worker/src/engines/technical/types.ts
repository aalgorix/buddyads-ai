export interface TechnicalPageFindings {
  page: string;
  url: string;
  pageType: string | null;
  title: boolean;
  titleLength: number;
  metaDescription: boolean;
  metaDescriptionLength: number;
  canonical: boolean;
  openGraph: boolean;
  openGraphTagCount: number;
  twitterCards: boolean;
  twitterCardTagCount: number;
  h1: boolean;
  h1Count: number;
  multipleH1: boolean;
  headingHierarchyValid: boolean;
  missingHeadingLevels: string[];
  headingCounts: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', number>;
  imageCount: number;
  missingAltImages: number;
  emptyAltImages: number;
  internalLinkCount: number;
  externalLinkCount: number;
  brokenInternalLinks: number;
  brokenInternalLinkUrls: string[];
  orphanPage: boolean;
  https: boolean;
  redirects: boolean;
  redirectCount: number;
  statusCode: number | null;
  viewport: boolean;
  charset: boolean;
  language: boolean;
  favicon: boolean;
  robots: boolean;
  sitemap: boolean;
  loadTimeMs: number | null;
  crawlError: string | null;
  organizationSchema: boolean;
  faqSchema: boolean;
  articleSchema: boolean;
  productSchema: boolean;
  breadcrumbSchema: boolean;
  localBusinessSchema: boolean;
  personSchema: boolean;
  eventSchema: boolean;
  schemaTypes: string[];
}

export interface SiteTechnicalContext {
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  favicon: string | null;
}
