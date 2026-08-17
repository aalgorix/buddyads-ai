import type { PageExtraction } from '../../research/types';
import type { AeoPageFindings } from '../aeo/analyze';
import type { TechnicalPageFindings } from '../technical/types';

export interface GeoPageFindings {
  page: string;
  url: string;
  pageType: string | null;
  entityCount: number;
  uniqueEntities: number;
  sampleEntities: string[];
  primaryTopic: string;
  secondaryTopics: string[];
  organizationSchema: boolean;
  personSchema: boolean;
  productSchema: boolean;
  faqSchema: boolean;
  schemaCompleteness: number;
  relatedPageCount: number;
  isHubPage: boolean;
  eeat: {
    about: boolean;
    privacy: boolean;
    terms: boolean;
    author: boolean;
    contact: boolean;
    testimonials: boolean;
  };
  aiContext: {
    company: boolean;
    products: boolean;
    services: boolean;
    pricing: boolean;
    contact: boolean;
    uniqueValueProposition: boolean;
  };
}

const TOPIC_KEYWORDS: Array<{ topic: string; re: RegExp }> = [
  { topic: 'AI Education', re: /\b(ai tutor|education|learning|student|course)\b/i },
  { topic: 'Marketing', re: /\b(marketing|seo|aeo|geo|advertising)\b/i },
  { topic: 'Software', re: /\b(software|saas|platform|app|api)\b/i },
  { topic: 'Healthcare', re: /\b(health|medical|clinic|patient)\b/i },
  { topic: 'Ecommerce', re: /\b(ecommerce|shop|store|cart|product)\b/i },
  { topic: 'Pricing', re: /\b(pricing|plans?|subscription)\b/i },
  { topic: 'Company', re: /\b(about|company|mission|team)\b/i },
  { topic: 'Support', re: /\b(support|help|faq|contact)\b/i },
  { topic: 'Services', re: /\b(services?|consulting|solutions?)\b/i },
];

function extractProperNouns(text: string): string[] {
  const matches = text.match(/\b[A-Z][a-zA-Z0-9&-]{2,}(?:\s+[A-Z][a-zA-Z0-9&-]{2,}){0,3}\b/g) || [];
  return matches.filter((m) => !['The', 'This', 'That', 'With', 'From', 'Your', 'Our'].includes(m));
}

export function analyzeGeo(
  pages: PageExtraction[],
  technical: TechnicalPageFindings[],
  aeo: AeoPageFindings[],
): GeoPageFindings[] {
  const techByUrl = new Map(technical.map((t) => [t.url, t]));
  const aeoByUrl = new Map(aeo.map((t) => [t.url, t]));
  const paths = pages.map((p) => {
    try {
      return new URL(p.finalUrl || p.url).pathname.toLowerCase();
    } catch {
      return p.url;
    }
  });
  const hasAbout = pages.some((p) => p.pageType === 'about') || paths.some((p) => /about/.test(p));
  const hasContact = pages.some((p) => p.pageType === 'contact') || paths.some((p) => /contact/.test(p));
  const hasPrivacy = paths.some((p) => /privacy/.test(p));
  const hasTerms = paths.some((p) => /terms/.test(p));

  return pages.map((page) => {
    const url = page.finalUrl || page.url;
    const tech = techByUrl.get(url);
    const a = aeoByUrl.get(url);
    const headings = [...page.headings.h1, ...page.headings.h2, ...page.headings.h3];
    const text = [page.title, page.metaDescription, ...headings, ...page.paragraphs, page.textExcerpt || '']
      .filter(Boolean)
      .join(' ');
    const nouns = extractProperNouns(text);
    const unique = [...new Set(nouns.map((n) => n.toLowerCase()))];
    const scores = TOPIC_KEYWORDS.map(({ topic, re }) => ({
      topic,
      score: (text.match(new RegExp(re.source, 'gi')) || []).length,
    })).sort((x, y) => y.score - x.score);
    const primary = page.pageType === 'pricing' ? 'Pricing' : page.pageType === 'about' ? 'Company' : scores[0]?.score ? scores[0].topic : 'General';
    const secondary = scores.filter((s) => s.topic !== primary && s.score > 0).slice(0, 3).map((s) => s.topic);
    const flags = [
      Boolean(tech?.organizationSchema || page.hasOrganizationSchema),
      Boolean(tech?.personSchema),
      Boolean(tech?.productSchema || page.hasProductSchema),
      Boolean(tech?.faqSchema || page.hasFaqSchema),
      Boolean(tech?.articleSchema || page.hasArticleSchema),
      Boolean(tech?.breadcrumbSchema || page.hasBreadcrumbSchema),
      Boolean(tech?.localBusinessSchema),
      Boolean(tech?.eventSchema),
    ];
    const relatedPageCount = new Set(page.links.filter((l) => l.kind === 'internal').map((l) => l.href)).size;
    const t = text.toLowerCase();
    return {
      page: (() => {
        try {
          return new URL(url).pathname || '/';
        } catch {
          return url;
        }
      })(),
      url,
      pageType: page.pageType,
      entityCount: nouns.length,
      uniqueEntities: unique.length,
      sampleEntities: [...new Set(nouns)].slice(0, 20),
      primaryTopic: primary,
      secondaryTopics: secondary,
      organizationSchema: flags[0],
      personSchema: flags[1],
      productSchema: flags[2],
      faqSchema: flags[3],
      schemaCompleteness: Math.round((flags.filter(Boolean).length / 8) * 100),
      relatedPageCount,
      isHubPage: relatedPageCount >= 5 || page.pageType === 'homepage',
      eeat: {
        about: hasAbout,
        privacy: hasPrivacy,
        terms: hasTerms,
        author: /\b(author|written by|byline)\b/i.test(text),
        contact: hasContact,
        testimonials: /\b(testimonial|case study|what our customers)\b/i.test(text),
      },
      aiContext: {
        company: a?.extractability.company || page.pageType === 'about' || /\babout us\b/.test(t),
        products: a?.extractability.products || /\bproduct\b/.test(t),
        services: a?.extractability.services || /\bservice\b/.test(t),
        pricing: a?.extractability.pricing || page.pageType === 'pricing',
        contact: a?.extractability.contact || hasContact,
        uniqueValueProposition: /\b(why (choose|us)|unique|unlike)\b/i.test(text),
      },
    };
  });
}

export function scoreGeo(findings: GeoPageFindings[]): number {
  if (!findings.length) return 28;
  const rows = findings.map((f) => {
    let n = 16;
    n += Math.min(18, f.uniqueEntities);
    n += Math.round(f.schemaCompleteness * 0.22);
    if (f.organizationSchema) n += 8;
    if (f.eeat.about) n += 6;
    if (f.eeat.contact) n += 5;
    if (f.eeat.privacy) n += 4;
    if (f.aiContext.uniqueValueProposition) n += 6;
    if (f.aiContext.products || f.aiContext.services) n += 6;
    if (f.isHubPage) n += 4;
    n += Math.min(8, f.relatedPageCount);
    return Math.max(0, Math.min(100, n));
  });
  return Math.round(rows.reduce((a, b) => a + b, 0) / rows.length);
}
