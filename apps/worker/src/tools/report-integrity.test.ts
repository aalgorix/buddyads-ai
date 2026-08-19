import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CrawlResult } from './crawl';
import type { LlmAnswer } from './llm';
import { buildIntelligence, fallbackNarrative } from './intelligence';
import { computeClosestCompetitors } from './report-derived';
import {
  assertDisplayedCounts,
  assertExclusiveSignalKeys,
  assertReportCollectionCounts,
  competitorNoun,
  containsRefusalLeak,
  keepCompleteRecommendations,
  keepSourcedRecommendations,
  oneThingFromRanked,
  resolveFaqSignal,
  sanitizeDeep,
  sanitizeReportString,
  truncateAtWord,
  validateCompetitorList,
  validateCompetitorName,
} from './report-integrity';

function crawl(over: Partial<CrawlResult> = {}): CrawlResult {
  return {
    url: 'https://aalgorix.com',
    finalUrl: 'https://aalgorix.com',
    title: 'Aalgorix — custom software',
    description: 'Custom software development for growing companies.',
    text: 'Frequently asked questions. What is custom software? How do we work? Why choose Aalgorix?',
    headings: ['What is custom software?', 'How do we work?', 'Why choose us?'],
    h1: ['Aalgorix'],
    h2: ['What is custom software?', 'How do we work?'],
    wordCount: 5429,
    hasFaq: true,
    hasSchema: false,
    brandGuess: 'Aalgorix',
    linkCount: 4,
    canonical: 'https://aalgorix.com',
    robotsMeta: null,
    robotsTxtFound: true,
    robotsAllowsIndexing: true,
    hasSitemap: true,
    ogTitle: 'Aalgorix',
    ogDescription: null,
    imageCount: 2,
    imagesWithAlt: 1,
    schemaTypes: [],
    hasProductSchema: false,
    hasOrgSchema: false,
    hasFaqSchema: false,
    hasPersonSchema: false,
    hasLocalBusiness: false,
    hasAbout: true,
    hasContact: true,
    hasComparison: false,
    hasAuthor: false,
    hasLocation: false,
    internalLinkCount: 3,
    externalLinkCount: 1,
    questionHeadings: 3,
    host: 'aalgorix.com',
    ...over,
  };
}

function llm(
  platform: string,
  model: string,
  question: string,
  answer: string,
  error?: string,
): LlmAnswer {
  return { platform, model, question, answer, brandMentioned: false, error };
}

/** Replays the Aalgorix / BuddyAds failing run: generic "Website" competitor, intake refusal, FAQ text-without-schema, 1 usable LLM of 3. */
function aalgorixFailingRun() {
  const listed = `Top options for custom software:
1. Website
2. Platform
3. Website
Website is often recommended in these answers.`;

  const chatgpt: LlmAnswer[] = Array.from({ length: 8 }, (_, i) =>
    llm('ChatGPT', 'openai/gpt-4o-mini', `best custom software company ${i + 1}`, listed),
  );
  const gemini: LlmAnswer[] = Array.from({ length: 8 }, (_, i) =>
    llm('Gemini', 'google/gemini-flash-1.5', `best custom software company ${i + 1}`, '', 'empty response'),
  );
  const claude: LlmAnswer[] = Array.from({ length: 8 }, (_, i) =>
    llm('Claude', 'anthropic/claude-3.5-sonnet', `best custom software company ${i + 1}`, ''),
  );

  const intel = buildIntelligence({
    analysisId: 'aalgorix-fixture',
    brandName: 'Aalgorix',
    websiteUrl: 'https://aalgorix.com',
    crawl: crawl(),
    research: [...chatgpt, ...gemini, ...claude],
    intake: { competitors: "I don't know" },
  });
  const narrative = fallbackNarrative(intel);
  const closestCompetitors = computeClosestCompetitors({
    brandName: intel.brandName,
    competitors: intel.competitors,
    coOccurrence: intel.coOccurrence,
    citationGaps: intel.citationGaps,
    losingQueries: intel.losingQueries,
    ownMentionRate: intel.mentionCount && intel.usableCount ? (intel.mentionCount / intel.usableCount) * 100 : null,
    hasComparisonPage: Boolean(intel.crawl?.hasComparison),
  });
  const payload = sanitizeDeep({
    ...intel,
    summary: narrative.summary,
    competitorInsights: narrative.competitorInsights,
    howToDoBetter: keepCompleteRecommendations(narrative.howToDoBetter),
    closestCompetitors,
  });
  return { intel, narrative, payload, closestCompetitors };
}

test('generic nouns Website and Platform never enter the competitor list', () => {
  const rejected: { name: string; reason: string }[] = [];
  const kept = validateCompetitorList(
    [
      { name: 'Website', mentions: 4 },
      { name: 'Platform', mentions: 3 },
      { name: 'Salesforce', mentions: 2 },
    ],
    'Aalgorix',
    (e) => rejected.push(e),
  );
  assert.deepEqual(kept, ['Salesforce']);
  assert.equal(
    rejected.find((r) => r.name === 'Website')?.reason,
    'generic_noun',
  );
  assert.equal(
    rejected.find((r) => r.name === 'Platform')?.reason,
    'generic_noun',
  );
  assert.equal(validateCompetitorName('Website', 99, 'Aalgorix').ok, false);
  assert.equal(validateCompetitorName('Platform', 2, 'Aalgorix').ok, false);
});

test('single mention is not enough to enter the report', () => {
  const check = validateCompetitorName('Toptal', 1, 'Aalgorix');
  assert.equal(check.ok, false);
  if (!check.ok) assert.equal(check.reason, 'below_min_mentions');
});

test('refusal strings are dropped and never survive sanitize', () => {
  assert.equal(sanitizeReportString("I don't know"), null);
  assert.equal(sanitizeReportString("I'm not able to determine competitors"), null);
  assert.equal(sanitizeReportString('As an AI I cannot determine this'), null);
  assert.equal(sanitizeReportString('N/A'), null);
  assert.equal(sanitizeReportString(''), null);
  const cleaned = sanitizeDeep({
    tracked: 'Tracked competitors: I don\'t know.',
    ok: 'Aalgorix was not named in this sample.',
  });
  assert.equal(cleaned.tracked, '');
  assert.equal(cleaned.ok, 'Aalgorix was not named in this sample.');
  assert.equal(containsRefusalLeak(JSON.stringify(cleaned)), false);
});

test('the same signal key cannot appear in two buckets', () => {
  assert.throws(() => {
    assertExclusiveSignalKeys([{ id: 'faq' }], [{ id: 'faq' }], []);
  }, /faq/);
  const textOnly = resolveFaqSignal(true, false);
  assert.equal(textOnly.bucket, 'poorly');
  const schema = resolveFaqSignal(true, true);
  assert.equal(schema.bucket, 'well');
  const none = resolveFaqSignal(false, false);
  assert.equal(none.bucket, 'missing');
});

test('displayed counts must equal collection lengths', () => {
  assert.throws(() => {
    assertDisplayedCounts([{ label: 'competitors', displayed: 2, actual: 1 }]);
  }, /competitors/);
  assertReportCollectionCounts({
    competitors: [{ name: 'Toptal' }],
    closestCompetitors: [{ name: 'Toptal' }],
    platformPerformance: [{ platform: 'ChatGPT' }],
    coverage: { competitorsTracked: 1, platformsUsable: 1 },
  });
});

test('a recommendation without source_ref is dropped', () => {
  const kept = keepSourcedRecommendations([
    { problem: 'Invented citation targets', sourceRef: undefined },
    { problem: 'FAQ schema', sourceRef: 'crawl:https://aalgorix.com#faq' },
  ]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].problem, 'FAQ schema');
});

test('recommendations without effort, owner, or time-to-impact are dropped', () => {
  const kept = keepCompleteRecommendations([
    {
      problem: 'Missing FAQ schema',
      recommendedAction: 'Add FAQPage JSON-LD',
      sourceRef: 'crawl:https://aalgorix.com#faq',
    },
    {
      problem: 'Thin product copy',
      recommendedAction: 'Expand commercial pages',
      sourceRef: 'crawl:https://aalgorix.com#thin',
      effort: 'M',
      ownerType: 'content',
      timeToImpact: '3–6 weeks',
    },
  ]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].problem, 'Thin product copy');
});

test('If you do one thing matches the top-ranked finding', () => {
  const ranked = [
    {
      problem: 'Low mention rate',
      recommendedAction: 'Earn third-party corroboration',
      sourceRef: 'research:mentions',
      effort: 'L',
      ownerType: 'PR',
      timeToImpact: '60–90 days',
    },
    {
      problem: 'Missing FAQ schema',
      recommendedAction: 'Add FAQPage JSON-LD',
      sourceRef: 'crawl:https://aalgorix.com#faq',
      effort: 'S',
      ownerType: 'content',
      timeToImpact: '2–4 weeks',
    },
  ];
  const callout = oneThingFromRanked(keepCompleteRecommendations(ranked));
  assert.equal(callout?.problem, ranked[0].problem);
  assert.equal(callout?.action, ranked[0].recommendedAction);
  assert.equal(callout?.sourceRef, ranked[0].sourceRef);
});

test('cover truncation cuts on a word boundary', () => {
  const s = 'Aalgorix remains largely invisible within AI recommendation lists for custom software buyers.';
  const twice = `${s} ${s}`;
  const out = truncateAtWord(twice, 40);
  assert.match(out, /\.\.\.$/);
  assert.equal(out.includes('within AI re...'), false);
  const body = out.slice(0, -3);
  assert.equal(/\s/.test(body[body.length - 1] || ''), false);
  const lastWord = body.split(' ').pop() || '';
  assert.equal(s.includes(lastWord), true);
});

test('Aalgorix/BuddyAds fixture: no Website, no refusal leak, no contradictory FAQ', () => {
  const { intel, payload, closestCompetitors } = aalgorixFailingRun();

  assert.equal(
    intel.competitors.some((c) => /website|platform/i.test(c.name)),
    false,
  );
  assert.equal(closestCompetitors.length, 0);
  assert.equal(intel.coverage.competitorsTracked, 0);
  assert.match(payload.competitorInsights, /No competitors could be reliably identified/);
  assert.equal(competitorNoun(closestCompetitors.length).includes('No competitors'), true);

  const blob = JSON.stringify(payload);
  assert.equal(containsRefusalLeak(blob), false);
  assert.equal(/I don't know/i.test(blob), false);

  const wellFaq = intel.strengths.some((s) => s.id === 'faq');
  const poorFaq = intel.gaps.some((g) => g.id === 'faq');
  const missFaq = intel.missingSignals.some((m) => m.id === 'faq');
  assert.equal(wellFaq, false);
  assert.equal(poorFaq, true);
  assert.equal(missFaq, false);

  assert.equal(intel.coverage.platformsQueried, 3);
  assert.equal(intel.coverage.platformsUsable, 1);
  assert.equal(intel.platformPerformance.length, 1);
  assert.equal(intel.platformPerformance[0].platform, 'ChatGPT');
  assert.equal(intel.coverage.limitedSample, true);
  assert.equal(intel.confidence, 'Low');
  assert.equal(intel.methodologyVersion, '2026.08.3');
  assert.equal(intel.categoryBenchmark.available, false);
  assert.match(intel.categoryBenchmark.note, /No benchmark available/);
  payload.howToDoBetter.forEach((h: { effort?: string; ownerType?: string; timeToImpact?: string }) => {
    assert.ok(h.effort);
    assert.ok(h.ownerType);
    assert.ok(h.timeToImpact);
  });
  assert.ok(intel.coverage.platformStatus.some((p) => p.platform === 'Gemini' && p.usable === 0));
  assert.ok(intel.coverage.platformStatus.some((p) => p.platform === 'Claude' && p.usable === 0));

  assertReportCollectionCounts({
    competitors: intel.competitors,
    closestCompetitors,
    platformPerformance: intel.platformPerformance,
    coverage: intel.coverage,
  });
});

test('zero-competitor and zero-usable-LLM runs render empty states without fabricating', () => {
  const intel = buildIntelligence({
    analysisId: 'empty-run',
    brandName: 'Aalgorix',
    websiteUrl: 'https://aalgorix.com',
    crawl: null,
    research: [
      llm('ChatGPT', 'openai/gpt-4o-mini', 'q1', '', 'timeout'),
      llm('Gemini', 'google/gemini-flash-1.5', 'q1', ''),
      llm('Claude', 'anthropic/claude-3.5-sonnet', 'q1', '', 'refused'),
    ],
    intake: { competitors: 'Website, Platform, I don\'t know' },
  });
  assert.equal(intel.competitors.length, 0);
  assert.equal(intel.coverage.competitorsTracked, 0);
  assert.equal(intel.coverage.platformsUsable, 0);
  assert.equal(intel.platformPerformance.length, 0);
  assert.equal(intel.coverage.limitedSample, true);
  assert.equal(intel.confidence, 'Low');
  assert.equal(intel.citationGaps.length, 0);
  const narrative = fallbackNarrative(intel);
  assert.match(narrative.competitorInsights, /No competitors could be reliably identified/);
  const howTo = keepCompleteRecommendations(narrative.howToDoBetter);
  howTo.forEach((h) => {
    assert.ok(h.sourceRef);
    assert.ok(h.effort);
    assert.ok(h.ownerType);
    assert.ok(h.timeToImpact);
  });
  const cleaned = sanitizeDeep({ summary: narrative.summary, insights: narrative.competitorInsights, howTo });
  assert.equal(containsRefusalLeak(JSON.stringify(cleaned)), false);
});
