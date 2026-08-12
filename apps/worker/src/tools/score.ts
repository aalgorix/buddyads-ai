import type { CrawlResult } from './crawl';
import type { LlmAnswer } from './llm';

export type ReportPayload = {
  brandName: string;
  websiteUrl: string;
  overall: number;
  aeo: number;
  geo: number;
  llmReady: number;
  grade: string;
  summary: string;
  recommendations: { title: string; detail: string; priority: string }[];
  research: LlmAnswer[];
  crawl: {
    title: string;
    description: string;
    wordCount: number;
    hasFaq: boolean;
    hasSchema: boolean;
    headings: string[];
  };
  confidence: 'Low' | 'Medium' | 'High';
  generatedAt: string;
};

function grade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function buildReport(params: {
  brandName: string;
  websiteUrl: string;
  crawl: CrawlResult | null;
  research: LlmAnswer[];
  agentNotes?: string;
}): ReportPayload {
  const crawl = params.crawl;
  const research = params.research.filter((r) => r.answer || r.error);

  let aeo = 35;
  if (crawl) {
    if (crawl.hasFaq) aeo += 18;
    if (crawl.headings.length >= 4) aeo += 12;
    if (crawl.wordCount > 400) aeo += 15;
    if (crawl.description.length > 40) aeo += 10;
    aeo = Math.min(100, aeo);
  }

  let geo = 30;
  if (crawl) {
    if (crawl.hasSchema) geo += 20;
    if (crawl.wordCount > 600) geo += 15;
    if (crawl.linkCount > 20) geo += 10;
    if (/about|team|contact|privacy/i.test(crawl.text)) geo += 15;
    geo = Math.min(100, geo);
  }

  const usable = research.filter((r) => r.answer && !r.error);
  const mentions = usable.filter((r) => r.brandMentioned).length;
  let llmReady = usable.length === 0 ? 25 : Math.round((mentions / Math.max(usable.length, 1)) * 70 + 15);
  if (usable.length >= 3) llmReady = Math.min(100, llmReady + 8);

  const overall = Math.round(aeo * 0.3 + geo * 0.3 + llmReady * 0.4);

  const recommendations: ReportPayload['recommendations'] = [];
  if (crawl && !crawl.hasFaq) {
    recommendations.push({
      title: 'Add answer-ready FAQ content',
      detail: 'LLMs extract crisp Q&A better when your site states common questions explicitly.',
      priority: 'high',
    });
  }
  if (crawl && !crawl.hasSchema) {
    recommendations.push({
      title: 'Publish JSON-LD entity markup',
      detail: 'Organization / Product schema helps generative engines ground your brand identity.',
      priority: 'high',
    });
  }
  if (usable.length && mentions === 0) {
    recommendations.push({
      title: 'Close the brand-mention gap across AI answers',
      detail: `Across ${usable.length} model replies, ${params.brandName} was not named. Strengthen third-party mentions, comparisons, and citable pages.`,
      priority: 'high',
    });
  } else if (usable.length && mentions < usable.length) {
    recommendations.push({
      title: 'Improve consistency across models',
      detail: `Only ${mentions}/${usable.length} researched replies mentioned the brand. Target models/contexts where you are invisible first.`,
      priority: 'medium',
    });
  }
  if (crawl && crawl.wordCount < 300) {
    recommendations.push({
      title: 'Expand primary page substance',
      detail: 'Thin pages give models little reliable surface to quote or recommend.',
      priority: 'medium',
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Maintain citable proof and refresh comparisons',
      detail: 'Keep entity clarity high and ship comparison / use-case pages AI can cite with confidence.',
      priority: 'low',
    });
  }

  const note = params.agentNotes?.trim();
  const mentionLine =
    usable.length === 0
      ? 'No successful multi-LLM sample answers were available for this run (missing key or provider errors).'
      : `Brand mentions: ${mentions} of ${usable.length} successful model replies.`;

  const summary = [
    `${params.brandName} scored ${overall}/100 on AI Visibility (grade ${grade(overall)}).`,
    `AEO ${aeo}, GEO ${geo}, LLM readiness ${llmReady}.`,
    mentionLine,
    note ? `Agent notes: ${note.slice(0, 400)}` : '',
    'Scores combine on-site extractability signals with sampled model answers. They are evidence snapshots, not private model rankings.',
  ]
    .filter(Boolean)
    .join(' ');

  const confidence: ReportPayload['confidence'] =
    usable.length >= 4 ? 'High' : usable.length >= 2 ? 'Medium' : 'Low';

  return {
    brandName: params.brandName,
    websiteUrl: params.websiteUrl,
    overall,
    aeo,
    geo,
    llmReady,
    grade: grade(overall),
    summary,
    recommendations: recommendations.slice(0, 6),
    research,
    crawl: {
      title: crawl?.title || '',
      description: crawl?.description || '',
      wordCount: crawl?.wordCount || 0,
      hasFaq: crawl?.hasFaq || false,
      hasSchema: crawl?.hasSchema || false,
      headings: crawl?.headings || [],
    },
    confidence,
    generatedAt: new Date().toISOString(),
  };
}
