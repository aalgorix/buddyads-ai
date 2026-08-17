import type { PageExtraction } from '../../research/types';
import type { TechnicalPageFindings } from '../technical/types';

export interface AeoExtractability {
  company: boolean;
  products: boolean;
  services: boolean;
  contact: boolean;
  pricing: boolean;
  location: boolean;
  benefits: boolean;
  features: boolean;
}

export interface AeoPageFindings {
  page: string;
  url: string;
  pageType: string | null;
  faqSectionDetected: boolean;
  hasFAQSchema: boolean;
  questionAnswerFormat: boolean;
  expandableFaqs: boolean;
  faqCount: number;
  shortAnswerParagraphs: number;
  definitionBlocks: number;
  listCount: number;
  tableCount: number;
  bulletAnswers: number;
  stepByStepSections: number;
  howToContent: boolean;
  featuredSnippetReady: boolean;
  answerNearTop: boolean;
  conciseAnswers: boolean;
  headingsSupportAnswers: boolean;
  voiceSearchFriendly: boolean;
  conversationalLanguage: boolean;
  naturalQuestions: number;
  longTailQuestions: number;
  howQuestions: number;
  whatQuestions: number;
  whyQuestions: number;
  whenQuestions: number;
  questionCoverage: number;
  questionsAnsweredEstimate: number;
  missingQuestionOpportunities: number;
  readabilityGrade: number;
  extractability: AeoExtractability;
}

function flattenHeadings(page: PageExtraction): string[] {
  return [...page.headings.h1, ...page.headings.h2, ...page.headings.h3, ...page.headings.h4];
}

function isQuestion(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.includes('?')) return true;
  return /^(what|why|how|when|where|who|which|can|does|is|are|do|should|will)\b/i.test(t);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function analyzeAeo(pages: PageExtraction[], technical: TechnicalPageFindings[]): AeoPageFindings[] {
  const techByUrl = new Map(technical.map((t) => [t.url, t]));
  return pages.map((page) => {
    const url = page.finalUrl || page.url;
    const tech = techByUrl.get(url);
    const headings = flattenHeadings(page);
    const paragraphs = page.paragraphs;
    const excerpt = page.textExcerpt || paragraphs.join(' ').slice(0, 8000);
    const fullText = [page.title, page.metaDescription, ...headings, ...paragraphs, excerpt].filter(Boolean).join(' ');
    const hasFAQSchema = Boolean(tech?.faqSchema) || page.hasFaqSchema;
    const questionHeadings = headings.filter(isQuestion);
    const uniqueQuestions = [...new Set([...questionHeadings, ...paragraphs.filter(isQuestion)].map((q) => q.trim().toLowerCase()))];
    const faqSectionDetected =
      /\b(faq|frequently asked|q\s*&\s*a)\b/i.test(`${headings.join(' ')} ${excerpt}`) ||
      questionHeadings.length >= 2;
    const shortAnswerParagraphs = paragraphs.filter((p) => {
      const w = wordCount(p);
      return w >= 8 && w <= 55;
    }).length;
    const definitionBlocks = paragraphs.filter((p) => /^(.{3,80}\s+(is|are|refers to|means)\b)/i.test(p.trim())).length;
    const howToContent = /\b(how to|step[- ]by[- ]step|guide|tutorial)\b/i.test(fullText);
    const conciseAnswers = shortAnswerParagraphs >= 2 || definitionBlocks >= 1;
    const featuredSnippetReady =
      (shortAnswerParagraphs >= 1 || definitionBlocks >= 1 || page.lists.length >= 1) && conciseAnswers;
    let howQuestions = 0;
    let whatQuestions = 0;
    let whyQuestions = 0;
    let whenQuestions = 0;
    for (const q of uniqueQuestions) {
      if (/^how\b/.test(q)) howQuestions += 1;
      else if (/^what\b/.test(q)) whatQuestions += 1;
      else if (/^why\b/.test(q)) whyQuestions += 1;
      else if (/^when\b/.test(q)) whenQuestions += 1;
    }
    const conversationalLanguage = /\b(you|your|we help|here's how)\b/i.test(fullText) || uniqueQuestions.length >= 1;
    const questionsAnsweredEstimate = Math.max(uniqueQuestions.length, hasFAQSchema ? 3 : 0, faqSectionDetected ? uniqueQuestions.length : 0);
    const covered =
      Number(howQuestions > 0) +
      Number(whatQuestions > 0) +
      Number(whyQuestions > 0) +
      Number(whenQuestions > 0) +
      Number(hasFAQSchema) +
      Number(howToContent);
    const missingQuestionOpportunities = Math.max(0, 8 - covered);
    const t = fullText.toLowerCase();
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
      faqSectionDetected,
      hasFAQSchema,
      questionAnswerFormat: uniqueQuestions.length >= 2,
      expandableFaqs: /\b(accordion|expand|collapse|show more)\b/i.test(excerpt),
      faqCount: uniqueQuestions.length,
      shortAnswerParagraphs,
      definitionBlocks,
      listCount: page.lists.length,
      tableCount: page.tables.length,
      bulletAnswers: page.lists.reduce((n, list) => n + list.filter((i) => wordCount(i) <= 40).length, 0),
      stepByStepSections: paragraphs.filter((p) => /^\s*(\d+[\).\]]|step\s+\d+)/i.test(p)).length,
      howToContent,
      featuredSnippetReady,
      answerNearTop: paragraphs.slice(0, 3).some((p) => wordCount(p) <= 55),
      conciseAnswers,
      headingsSupportAnswers: Boolean(tech?.h1) && headings.length >= 2,
      voiceSearchFriendly: conversationalLanguage && howQuestions + whatQuestions + whyQuestions + whenQuestions >= 1,
      conversationalLanguage,
      naturalQuestions: uniqueQuestions.length,
      longTailQuestions: uniqueQuestions.filter((q) => wordCount(q) >= 6).length,
      howQuestions,
      whatQuestions,
      whyQuestions,
      whenQuestions,
      questionCoverage: Math.min(100, Math.round((questionsAnsweredEstimate / Math.max(1, questionsAnsweredEstimate + missingQuestionOpportunities)) * 100)),
      questionsAnsweredEstimate,
      missingQuestionOpportunities,
      readabilityGrade: 8,
      extractability: {
        company: /\b(about us|our company|we are|founded)\b/.test(t) || page.pageType === 'about',
        products: /\b(product|platform|solution|software)\b/.test(t) || page.pageType === 'products',
        services: /\b(service|consulting|we offer)\b/.test(t) || page.pageType === 'services',
        contact: /\b(contact|email|phone)\b/.test(t) || page.pageType === 'contact',
        pricing: /\b(pricing|price|plan|subscription)\b/.test(t) || page.pageType === 'pricing',
        location: /\b(address|headquarters|located in|office)\b/.test(t),
        benefits: /\b(benefit|advantage|why choose|outcomes?)\b/.test(t),
        features: /\b(feature|capabilities|includes|integrations?)\b/.test(t),
      },
    };
  });
}

export function scoreAeo(findings: AeoPageFindings[]): number {
  if (!findings.length) return 30;
  const rows = findings.map((f) => {
    let n = 18;
    if (f.hasFAQSchema) n += 16;
    else if (f.faqSectionDetected) n += 10;
    n += Math.min(14, f.naturalQuestions * 3);
    if (f.featuredSnippetReady) n += 10;
    if (f.howToContent) n += 8;
    if (f.conciseAnswers) n += 8;
    if (f.voiceSearchFriendly) n += 8;
    n += Math.round(f.questionCoverage * 0.18);
    if (f.extractability.company) n += 4;
    if (f.extractability.products || f.extractability.services) n += 4;
    return Math.max(0, Math.min(100, n));
  });
  return Math.round(rows.reduce((a, b) => a + b, 0) / rows.length);
}
