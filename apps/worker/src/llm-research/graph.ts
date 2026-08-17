import { detectMention, extractCitations, parseNameList } from '../tools/extract';
import type { LlmAnswer } from '../tools/llm';

export type ParsedEvidence = {
  model: string;
  question: string;
  brandMentioned: boolean;
  competitorsMentioned: string[];
  citations: { url: string; domain: string }[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
};

export type KnowledgeGraph = {
  brand: string;
  mentionCount: number;
  responseCount: number;
  competitorHits: Record<string, number>;
  citationDomains: string[];
  summary: string;
};

function sentimentOf(text: string, brand: string): ParsedEvidence['sentiment'] {
  const window = text.toLowerCase();
  const near = brand.toLowerCase();
  const idx = window.indexOf(near);
  const slice = idx >= 0 ? window.slice(Math.max(0, idx - 80), idx + near.length + 80) : window;
  const pos = /\b(best|leading|recommended|trusted|excellent|top|strong)\b/.test(slice);
  const neg = /\b(worst|avoid|poor|unreliable|overpriced|not recommended)\b/.test(slice);
  if (pos && neg) return 'mixed';
  if (pos) return 'positive';
  if (neg) return 'negative';
  return 'neutral';
}

export function parseResearch(research: LlmAnswer[], brand: string, competitorsRaw?: string | null): ParsedEvidence[] {
  const competitors = parseNameList(competitorsRaw);
  return research.map((r) => ({
    model: r.model,
    question: r.question,
    brandMentioned: r.brandMentioned || detectMention(r.answer, brand),
    competitorsMentioned: competitors.filter((c) => detectMention(r.answer, c)),
    citations: extractCitations(r.answer),
    sentiment: r.answer ? sentimentOf(r.answer, brand) : 'neutral',
  }));
}

export function buildEvidence(parsed: ParsedEvidence[]) {
  const mentions = parsed.filter((p) => p.brandMentioned);
  const citations = parsed.flatMap((p) => p.citations);
  return {
    mentionRate: parsed.length ? Math.round((mentions.length / parsed.length) * 100) : 0,
    citationCount: citations.length,
    uniqueDomains: [...new Set(citations.map((c) => c.domain))],
    positiveMentions: mentions.filter((p) => p.sentiment === 'positive').length,
    competitorOverlap: parsed.filter((p) => p.competitorsMentioned.length > 0).length,
  };
}

export function buildKnowledgeGraph(
  brand: string,
  parsed: ParsedEvidence[],
  competitorsRaw?: string | null,
): KnowledgeGraph {
  const competitors = parseNameList(competitorsRaw);
  const competitorHits: Record<string, number> = {};
  for (const name of competitors) competitorHits[name] = 0;
  for (const row of parsed) {
    for (const name of row.competitorsMentioned) {
      competitorHits[name] = (competitorHits[name] || 0) + 1;
    }
  }
  const mentionCount = parsed.filter((p) => p.brandMentioned).length;
  const citationDomains = [...new Set(parsed.flatMap((p) => p.citations.map((c) => c.domain)))];
  const leader = Object.entries(competitorHits).sort((a, b) => b[1] - a[1])[0];
  const summary =
    parsed.length === 0
      ? `No LLM samples stored for ${brand}.`
      : `${brand} was named in ${mentionCount}/${parsed.length} parsed replies. ${
          leader ? `Most frequent competitor mention: ${leader[0]} (${leader[1]}).` : 'No named competitors from intake appeared.'
        } Citation domains: ${citationDomains.slice(0, 6).join(', ') || 'none'}.`;
  return {
    brand,
    mentionCount,
    responseCount: parsed.length,
    competitorHits,
    citationDomains,
    summary,
  };
}
