export type PromptCategory =
  | 'best_of'
  | 'audience'
  | 'industry'
  | 'geography'
  | 'feature'
  | 'pricing'
  | 'competitor_alternative'
  | 'competitor_comparison'
  | 'faq_derived'
  | 'use_case'
  | 'brand';

export type GeneratedPrompt = {
  prompt: string;
  category: PromptCategory;
  source: string;
  priority: number;
};

function splitList(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;/|]| and /i).map((s) => s.trim()).filter(Boolean)) {
    const key = part.toLowerCase();
    if (seen.has(key) || part.length < 2) continue;
    seen.add(key);
    out.push(part);
  }
  return out;
}

export function generateResearchPrompts(params: {
  brand: string;
  intake: {
    companyName?: string | null;
    businessDescription?: string | null;
    productsServices?: string | null;
    idealCustomers?: string | null;
    countries?: string | null;
    competitors?: string | null;
    marketingChallenge?: string | null;
  } | null;
  pageTitles: string[];
  faqHeadings: string[];
  topics: string[];
  maxCount?: number;
}): GeneratedPrompt[] {
  const brand = params.brand;
  const products = splitList(params.intake?.productsServices);
  const noun = products[0] || params.intake?.businessDescription?.split(/[,.]/)[0]?.trim() || brand;
  const audiences = splitList(params.intake?.idealCustomers);
  const geos = splitList(params.intake?.countries);
  const competitors = splitList(params.intake?.competitors);
  const industry = params.intake?.businessDescription || '';
  const bag = new Map<string, GeneratedPrompt>();
  const add = (prompt: string, category: PromptCategory, source: string, priority: number) => {
    const cleaned = prompt.replace(/\s+/g, ' ').trim();
    if (cleaned.length < 8) return;
    const key = cleaned.toLowerCase();
    const existing = bag.get(key);
    if (existing && existing.priority <= priority) return;
    bag.set(key, { prompt: cleaned, category, source, priority });
  };

  add(`Best ${noun}`, 'best_of', 'product', 10);
  add(`Top ${noun} tools`, 'best_of', 'product', 16);
  add(`What companies would you recommend for ${noun}? Name specific brands.`, 'best_of', 'product', 12);
  add(`Who are the leading ${noun} providers?`, 'best_of', 'product', 13);
  add(`Best ${noun} companies 2026`, 'best_of', 'product', 15);
  add(`${noun} comparison — which brands should a buyer shortlist?`, 'best_of', 'product', 17);
  add(`Cheapest ${noun} options worth considering`, 'pricing', 'product', 35);
  add(`Enterprise ${noun} vendors`, 'audience', 'product', 27);
  add(`${noun} for startups`, 'audience', 'product', 29);
  add(`Who should I hire for ${noun}?`, 'use_case', 'product', 21);
  add(`What is the best alternative if I need ${noun}?`, 'competitor_alternative', 'product', 23);
  add(`How do buyers evaluate ${noun} vendors?`, 'use_case', 'product', 31);
  add(`Which ${noun} brands are cited by analysts or review sites?`, 'brand', 'product', 32);
  for (const product of products.slice(0, 6)) {
    add(`Best ${product} software`, 'best_of', 'product', 14);
    add(`${product} for SMEs`, 'audience', 'product', 28);
    add(`${product} pricing comparison`, 'pricing', 'product', 34);
    add(`Best ${product} for mid-market teams`, 'audience', 'product', 25);
  }
  for (const audience of audiences.slice(0, 4)) {
    add(`Best ${noun} for ${audience}`, 'audience', 'audience', 18);
  }
  for (const geo of geos.slice(0, 4)) {
    add(`Best ${noun} in ${geo}`, 'geography', 'geography', 22);
  }
  for (const competitor of competitors.slice(0, 5)) {
    add(`${competitor} alternatives`, 'competitor_alternative', 'competitor', 18);
    add(`${brand} vs ${competitor}`, 'competitor_comparison', 'competitor', 24);
  }
  if (industry) add(`Best ${noun} for ${industry.split(' ').slice(0, 6).join(' ')}`, 'industry', 'industry', 20);
  add(`What is ${brand}`, 'brand', 'intake', 36);
  add(`${brand} reviews`, 'brand', 'intake', 38);
  if (params.intake?.marketingChallenge) {
    add(
      `Regarding "${params.intake.marketingChallenge}" — which brands dominate AI recommendations, and why might ${brand} be missing?`,
      'use_case',
      'intake',
      26,
    );
  }
  for (const q of params.faqHeadings.slice(0, 8)) {
    add(q.replace(/\?+$/, ''), 'faq_derived', 'faq', 30);
  }
  for (const title of params.pageTitles) {
    if (/\?/.test(title) || /^(what|how|why|when|which)\b/i.test(title)) add(title, 'faq_derived', 'content', 32);
  }
  for (const topic of params.topics.slice(0, 4)) {
    if (/^(general|support|company|pricing)$/i.test(topic)) continue;
    add(`Best tools for ${topic}`, 'use_case', 'content', 33);
  }
  add(`Where would you send someone for independent information about ${brand} and ${noun}?`, 'brand', 'intake', 34);
  add(`Is ${brand} a real option for ${noun}, or do assistants recommend others instead?`, 'brand', 'intake', 19);
  add(`List five specific companies that offer ${noun} besides ${brand}.`, 'best_of', 'product', 11);

  let pad = 1;
  while (bag.size < (params.maxCount ?? 40) && pad <= 40) {
    add(
      `Which companies would you recommend for ${noun} to a first-time buyer looking at option set ${pad}? Name specific brands.`,
      'best_of',
      'pad',
      50 + pad,
    );
    pad += 1;
  }

  const maxCount = params.maxCount ?? 40;
  return [...bag.values()].sort((a, b) => a.priority - b.priority).slice(0, maxCount);
}
