import assert from 'node:assert/strict';
import { test } from 'node:test';
import zlib from 'node:zlib';
import { METHODOLOGY, METHODOLOGY_VERSION, AI_VISIBILITY_GRADE_BANDS, ON_SITE_GRADE_BANDS, confidenceOf, onSiteConfidenceOf, resolveQueryCount, sampleCaveatFor } from '../config/methodology';
import {
  assertDisplayedMetricsTagged,
  computeAiVisibilityScore,
  computeOnSiteReadinessScore,
  displayedBreakdownSumsToTotal,
  displayedScore,
} from './score-formula';
import { buildIntelligence, fallbackNarrative } from './intelligence';
import { computeClosestCompetitors } from './report-derived';
import { keepCompleteRecommendations, oneThingFromRanked, sanitizeDeep } from './report-integrity';
import { renderReportPdfDocument, STRATEGY_CALL_CTA } from '@buddyads/report-pdf';
import type { CrawlResult } from './crawl';
import type { LlmAnswer } from './llm';

test('each split score sums to its displayed total', () => {
  const vis = computeAiVisibilityScore({
    mentionRate: 0,
    citationRate: 0,
    avgPosition: null,
    usableResponses: 8,
  });
  const site = computeOnSiteReadinessScore({
    aeo: 40,
    geo: 40,
    technical: 40,
    entityStrength: 40,
    websiteUrl: 'https://aalgorix.com',
  });
  assert.equal(displayedBreakdownSumsToTotal(vis), true);
  assert.equal(displayedBreakdownSumsToTotal(site), true);
  assert.equal(displayedScore(vis), 0);
  assert.equal(displayedScore(site), 40);
  assert.equal(vis.components.find((c) => c.key === 'position')?.excluded, true);
  assert.equal(vis.components.find((c) => c.key === 'mentionRate')?.contribution, 0);
  assert.equal(
    vis.components.some((c) => ['aeo', 'geo', 'technical', 'entity'].includes(c.key)),
    false,
  );
  assert.equal(
    site.components.some((c) => ['mentionRate', 'citationRate', 'position'].includes(c.key)),
    false,
  );
});

test('excluded position does not shift weight onto on-site signals', () => {
  const siteA = computeOnSiteReadinessScore({
    aeo: 40,
    geo: 50,
    technical: 60,
    entityStrength: 30,
    websiteUrl: 'https://aalgorix.com',
  });
  const visExcluded = computeAiVisibilityScore({
    mentionRate: 10,
    citationRate: 0,
    avgPosition: null,
    usableResponses: 8,
  });
  const visListed = computeAiVisibilityScore({
    mentionRate: 10,
    citationRate: 0,
    avgPosition: 1,
    usableResponses: 8,
  });
  const siteB = computeOnSiteReadinessScore({
    aeo: 40,
    geo: 50,
    technical: 60,
    entityStrength: 30,
    websiteUrl: 'https://aalgorix.com',
  });
  assert.deepEqual(
    siteA.components.map((c) => [c.key, c.weight, c.contribution]),
    siteB.components.map((c) => [c.key, c.weight, c.contribution]),
  );
  const visWeightSum = visExcluded.components.reduce((s, c) => s + c.weight, 0);
  assert.ok(Math.abs(visWeightSum - 1) < 0.02);
  assert.equal(visExcluded.components.find((c) => c.key === 'position')?.weight, 0);
  assert.ok((visExcluded.components.find((c) => c.key === 'mentionRate')?.weight || 0) >
    (visListed.components.find((c) => c.key === 'mentionRate')?.weight || 0));
  assert.equal(siteA.components.find((c) => c.key === 'aeo')?.weight, siteB.components.find((c) => c.key === 'aeo')?.weight);
});

test('zero usable LLM responses make AI Visibility N/A without changing on-site', () => {
  const vis = computeAiVisibilityScore({
    mentionRate: null,
    citationRate: null,
    avgPosition: null,
    usableResponses: 0,
  });
  const site = computeOnSiteReadinessScore({
    aeo: 50,
    geo: 50,
    technical: 50,
    entityStrength: 50,
  });
  assert.equal(displayedBreakdownSumsToTotal(vis), true);
  assert.equal(displayedBreakdownSumsToTotal(site), true);
  assert.equal(displayedScore(vis), null);
  assert.equal(displayedScore(site), 50);
  assert.equal(vis.components.every((c) => c.excluded), true);
});

test('on-site confidence is crawl-based and ignores usable LLM count', () => {
  const crawl = {
    wordCount: 5429,
    robotsTxtFound: true as boolean | null,
    hasSitemap: true as boolean | null,
  };
  const high = onSiteConfidenceOf(crawl);
  assert.equal(high.level, 'High');
  assert.match(high.reason, /Independent of LLM sample size/);
  assert.equal(onSiteConfidenceOf({ wordCount: 200, robotsTxtFound: true, hasSitemap: true }).level, 'Medium');
  assert.equal(onSiteConfidenceOf({ wordCount: 0, robotsTxtFound: null, hasSitemap: null }).level, 'Low');
  assert.equal(confidenceOf({ usableLlms: 0, queriedLlms: 3, sampleSize: 0 }).level, 'Low');
  assert.equal(confidenceOf({ usableLlms: 3, queriedLlms: 3, sampleSize: 32 }).level, 'High');
  assert.equal(onSiteConfidenceOf(crawl).level, high.level);
});

test('confidence resolves at each threshold and under the <2-LLM override', () => {
  assert.equal(confidenceOf({ usableLlms: 3, queriedLlms: 3, sampleSize: 30 }).level, 'High');
  assert.equal(confidenceOf({ usableLlms: 3, queriedLlms: 3, sampleSize: 29 }).level, 'Medium');
  assert.equal(confidenceOf({ usableLlms: 2, queriedLlms: 3, sampleSize: 20 }).level, 'Medium');
  assert.equal(confidenceOf({ usableLlms: 2, queriedLlms: 3, sampleSize: 19 }).level, 'Low');
  assert.equal(confidenceOf({ usableLlms: 1, queriedLlms: 3, sampleSize: 40 }).level, 'Low');
  assert.match(confidenceOf({ usableLlms: 1, queriedLlms: 3, sampleSize: 40 }).reason, /1 of 3/);
  assert.equal(confidenceOf({ usableLlms: 0, queriedLlms: 3, sampleSize: 0 }).level, 'Low');
});

test('n<20 triggers the caveat; n>=20 does not', () => {
  assert.equal(sampleCaveatFor(19), METHODOLOGY.sampleCaveat);
  assert.equal(sampleCaveatFor(20), null);
  assert.equal(resolveQueryCount(undefined), METHODOLOGY.defaultQueryCount);
  assert.ok(resolveQueryCount(8) >= METHODOLOGY.minQueryCount);
  assert.ok(resolveQueryCount(99) <= METHODOLOGY.maxQueryCount);
});

test('every displayed number carries a provenance tag', () => {
  assert.throws(() => assertDisplayedMetricsTagged([]), /No displayed metrics/);
  assert.throws(
    () =>
      assertDisplayedMetricsTagged([
        { key: 'x', label: 'x', value: 1, provenance: 'OBSERVED' as const, sourceRef: '' },
      ]),
    /sourceRef/,
  );
  assertDisplayedMetricsTagged([
    { key: 'buddyScore', label: 'BuddyScore', value: 20, provenance: 'ESTIMATED', sourceRef: 'formula:buddyScore' },
    { key: 'n', label: 'n', value: 8, provenance: 'OBSERVED', sourceRef: 'run:prompts' },
  ]);
});

function crawl(): CrawlResult {
  return {
    url: 'https://aalgorix.com',
    finalUrl: 'https://aalgorix.com',
    title: 'Aalgorix — custom software',
    description: 'Custom software development for growing companies.',
    text: 'Frequently asked questions. What is custom software?',
    headings: ['What is custom software?'],
    h1: ['Aalgorix'],
    h2: ['What is custom software?'],
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
  };
}

function llm(platform: string, model: string, question: string, answer: string, error?: string): LlmAnswer {
  return { platform, model, question, answer, brandMentioned: false, error };
}

/** pdf-lib Flate-compresses streams and hex-encodes Tj strings. */
function extractedPdfText(buf: Buffer): string {
  const ascii = buf.toString('latin1');
  const streams: string[] = [];
  const re = /\/Length\s+(\d+)[\s\S]*?>>\s*stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ascii))) {
    const start = m.index + m[0].length;
    try {
      streams.push(zlib.inflateSync(buf.subarray(start, start + Number(m[1]))).toString('latin1'));
    } catch {
      // skip non-flate streams (fonts, images)
    }
  }
  const decoded = streams.join('\n');
  const hex = [...decoded.matchAll(/<([0-9A-Fa-f]+)>/g)].map((x) => Buffer.from(x[1], 'hex').toString('latin1'));
  return hex.join('\n');
}

test('Aalgorix fixture: Confidence Low with reason, score breakdown reconciles', () => {
  const listed = `Top options for custom software:
1. Website
2. Platform
3. Website
Website is often recommended in these answers.`;
  const chatgpt = Array.from({ length: 8 }, (_, i) =>
    llm('ChatGPT', 'openai/gpt-4o-mini', `best custom software company ${i + 1}`, listed),
  );
  const gemini = Array.from({ length: 8 }, (_, i) =>
    llm('Gemini', 'google/gemini-flash-1.5', `best custom software company ${i + 1}`, '', 'empty response'),
  );
  const claude = Array.from({ length: 8 }, (_, i) =>
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
  assert.equal(intel.confidence, 'Low');
  assert.match(intel.confidenceReason, /1 of 3/);
  assert.equal(intel.coverage.sampleSize, 8);
  assert.equal(intel.coverage.sampleCaveat, METHODOLOGY.sampleCaveat);
  assert.equal(intel.scores.aiVisibility, 0);
  assert.equal(intel.aiVisibilityBreakdown.total, 0);
  assert.equal(displayedBreakdownSumsToTotal(intel.aiVisibilityBreakdown), true);
  assert.equal(displayedBreakdownSumsToTotal(intel.onSiteBreakdown), true);
  assert.ok((intel.scores.onSiteReadiness ?? 0) > 0);
  assert.equal(intel.onSiteConfidence, 'High');
  assert.match(intel.onSiteConfidenceReason, /Independent of LLM sample size/);
  assert.equal(intel.onSiteConfidenceReason.includes(METHODOLOGY.sampleCaveat), false);
  assert.equal(intel.crawl.wordCount, 5429);
  assert.ok(intel.gaps.some((g) => g.id === 'faq'));
  assert.ok(intel.scoreBreakdown);
  assert.equal(displayedBreakdownSumsToTotal(intel.scoreBreakdown), true);
  assert.equal(intel.scores.buddyScore, intel.scoreBreakdown.total);
  assert.equal(intel.methodologyVersion, METHODOLOGY_VERSION);
  assert.ok(intel.displayedMetrics.length > 0);
  intel.displayedMetrics.forEach((m) => {
    assert.ok(m.provenance === 'OBSERVED' || m.provenance === 'ESTIMATED');
    assert.ok(m.sourceRef);
  });
  const payload = sanitizeDeep({
    ...intel,
    summary: fallbackNarrative(intel).summary,
    howToDoBetter: keepCompleteRecommendations(fallbackNarrative(intel).howToDoBetter),
    closestCompetitors: computeClosestCompetitors({
      brandName: intel.brandName,
      competitors: intel.competitors,
      coOccurrence: intel.coOccurrence,
      citationGaps: intel.citationGaps,
      losingQueries: intel.losingQueries,
      ownMentionRate: 0,
      hasComparisonPage: false,
    }),
  });
  assert.equal(payload.confidence, 'Low');
  assert.equal(payload.methodologyVersion, METHODOLOGY_VERSION);
  assert.ok(payload.methodologyVersion);
});

test('methodologyVersion is present on every generated report', () => {
  const intel = buildIntelligence({
    analysisId: 'method-version',
    brandName: 'Aalgorix',
    websiteUrl: 'https://aalgorix.com',
    crawl: null,
    research: [],
  });
  assert.equal(intel.methodologyVersion, METHODOLOGY_VERSION);
  assert.ok(intel.methodologyVersion.length > 0);
  assert.equal(intel.categoryBenchmark.available, false);
});

test('on-site score and confidence ignore usable LLM count on the same crawl', () => {
  const listed = `Top options for custom software:
1. Website
2. Platform`;
  const many = Array.from({ length: 32 }, (_, i) =>
    llm(['ChatGPT', 'Gemini', 'Claude'][i % 3], 'model', `q ${i + 1}`, listed),
  );
  const none = [
    llm('ChatGPT', 'openai/gpt-4o-mini', 'q1', '', 'timeout'),
    llm('Gemini', 'google/gemini-flash-1.5', 'q1', ''),
    llm('Claude', 'anthropic/claude-3.5-sonnet', 'q1', '', 'refused'),
  ];
  const withLlms = buildIntelligence({
    analysisId: 'onsite-a',
    brandName: 'Aalgorix',
    websiteUrl: 'https://aalgorix.com',
    crawl: crawl(),
    research: many,
  });
  const withoutLlms = buildIntelligence({
    analysisId: 'onsite-b',
    brandName: 'Aalgorix',
    websiteUrl: 'https://aalgorix.com',
    crawl: crawl(),
    research: none,
  });
  assert.equal(withLlms.onSiteConfidence, withoutLlms.onSiteConfidence);
  assert.equal(withLlms.scores.onSiteReadiness, withoutLlms.scores.onSiteReadiness);
  assert.ok(withLlms.confidence !== withoutLlms.confidence || withLlms.coverage.platformsUsable !== withoutLlms.coverage.platformsUsable);
  assert.equal(withoutLlms.scores.aiVisibility, null);
  assert.equal(withoutLlms.coverage.sampleCaveat, METHODOLOGY.sampleCaveat);
  assert.equal(withoutLlms.onSiteConfidenceReason.includes(METHODOLOGY.sampleCaveat), false);
});

test('Aalgorix fixture: one-thing callout matches top finding; PDF has one strategy-call CTA', async () => {
  const listed = `Top options for custom software:
1. Website
2. Platform
3. Website
Website is often recommended in these answers.`;
  const chatgpt = Array.from({ length: 8 }, (_, i) =>
    llm('ChatGPT', 'openai/gpt-4o-mini', `best custom software company ${i + 1}`, listed),
  );
  const gemini = Array.from({ length: 8 }, (_, i) =>
    llm('Gemini', 'google/gemini-flash-1.5', `best custom software company ${i + 1}`, '', 'empty response'),
  );
  const claude = Array.from({ length: 8 }, (_, i) =>
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
  const howToDoBetter = keepCompleteRecommendations(narrative.howToDoBetter);
  assert.ok(howToDoBetter.length > 0);
  howToDoBetter.forEach((h) => {
    assert.ok(h.sourceRef);
    assert.ok(h.effort);
    assert.ok(h.ownerType);
    assert.ok(h.timeToImpact);
  });
  const oneThingCallout = oneThingFromRanked(howToDoBetter);
  assert.ok(oneThingCallout);
  assert.equal(oneThingCallout.problem, howToDoBetter[0].problem);
  assert.equal(oneThingCallout.action, howToDoBetter[0].recommendedAction);
  assert.equal(oneThingCallout.sourceRef, howToDoBetter[0].sourceRef);

  const pdf = await renderReportPdfDocument(
    {
      ...intel,
      summary: narrative.summary,
      executiveSummary: { ...narrative.executiveSummary, oneThing: oneThingCallout },
      howToDoBetter,
      oneThingCallout,
      finalTakeaway: narrative.finalTakeaway,
      strongestPlatform: narrative.strongestPlatform,
      weakestPlatform: narrative.weakestPlatform,
      llmStrategies: [],
      closestCompetitors: computeClosestCompetitors({
        brandName: intel.brandName,
        competitors: intel.competitors,
        coOccurrence: intel.coOccurrence,
        citationGaps: intel.citationGaps,
        losingQueries: intel.losingQueries,
        ownMentionRate: 0,
        hasComparisonPage: false,
      }),
    },
    'Aalgorix',
  );
  const text = extractedPdfText(pdf);
  const ctaHits = text.split(STRATEGY_CALL_CTA).length - 1;
  assert.equal(ctaHits, 1, `expected exactly one "${STRATEGY_CALL_CTA}", found ${ctaHits}`);
  assert.equal(/full playbooks/i.test(text), false);
  assert.ok(text.includes(METHODOLOGY_VERSION));
  assert.ok(text.includes('No benchmark available for this category'));
  assert.ok(text.includes('If you do one thing'));
  assert.ok(text.includes('AI Visibility'));
  assert.ok(text.includes('On-site AI-readiness'));
  assert.ok(/legacy BuddyScore/i.test(text));
  assert.ok(text.includes(METHODOLOGY.sampleCaveat) || /Directional only/i.test(text));
  assert.ok(/independent of LLM/i.test(text));
  assert.equal('grade' in intel, false);
  assert.equal(/\bGrade\b/i.test(text), false, 'letter grade must not appear in rendered PDF');
  assert.equal(/\b[ABCDF][+\-]? \/ 100\b/.test(text), false);
});

test('letter-grade bands stay in config and are not applied', () => {
  assert.equal(AI_VISIBILITY_GRADE_BANDS.find((b) => b.band === 'F')?.max, 14);
  assert.equal(ON_SITE_GRADE_BANDS.find((b) => b.band === 'C')?.min, 50);
  const intel = buildIntelligence({
    analysisId: 'no-grade',
    brandName: 'Aalgorix',
    websiteUrl: 'https://aalgorix.com',
    crawl: crawl(),
    research: [],
  });
  assert.equal('grade' in intel, false);
  assert.equal(JSON.stringify(intel).includes('"grade"'), false);
});
