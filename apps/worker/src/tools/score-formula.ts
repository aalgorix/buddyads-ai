import type { DisplayedMetric, Provenance, ScoreBreakdown, ScoreComponent } from '@buddyads/report-pdf';

export type { Provenance, ScoreBreakdown, ScoreComponent };

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

type Candidate = {
  key: string;
  label: string;
  raw: number | null;
  rawDisplay: string;
  normalized: number | null;
  targetWeight: number;
  provenance: Provenance;
  sourceRef: string;
  excluded: boolean;
  excludeReason?: string;
};

const MISSING_POLICY = 'excluded_and_weights_renormalized' as const;

const AI_VIS_NOTE =
  'AI Visibility uses only mention rate, citation rate, and average position. Missing inputs (N/A) are excluded and the remaining AI-Visibility weights are renormalized to 100%. Observed zeros stay zero. Weight never moves onto on-site signals.';

const ON_SITE_NOTE =
  'On-site AI-readiness uses only AEO, GEO, technical, and entity strength from the crawl. Missing inputs are excluded and remaining on-site weights are renormalized to 100%. Weight never moves onto AI Visibility.';

const LEGACY_NOTE =
  'Legacy BuddyScore mixed AI Visibility and on-site signals in one number. It is not comparable across methodologyVersion changes and is retained only for historical reference.';

/** Part 2 LLM slice (28+18+12), renormalized to 100% within AI Visibility. */
export const AI_VISIBILITY_WEIGHTS = {
  mentionRate: 28 / 58,
  citationRate: 18 / 58,
  position: 12 / 58,
} as const;

/** Part 2 crawl slice (16+14+8+4), renormalized to 100% within on-site readiness. */
export const ON_SITE_WEIGHTS = {
  aeo: 16 / 42,
  geo: 14 / 42,
  technical: 8 / 42,
  entity: 4 / 42,
} as const;

function assembleBreakdown(
  candidates: Candidate[],
  missingPolicyNote: string,
  extras?: { label?: string; scope?: ScoreBreakdown['scope'] },
): ScoreBreakdown {
  const active = candidates.filter((c) => !c.excluded && c.normalized != null);
  const weightSum = active.reduce((s, c) => s + c.targetWeight, 0);
  const scale = weightSum > 0 ? 1 / weightSum : 0;

  const withWeights: ScoreComponent[] = candidates.map((c) => {
    const weight = c.excluded || c.normalized == null || scale === 0 ? 0 : round1(c.targetWeight * scale * 100) / 100;
    const contribution = c.excluded || c.normalized == null ? 0 : (c.normalized as number) * (c.targetWeight * scale);
    return {
      key: c.key,
      label: c.label,
      raw: c.raw,
      rawDisplay: c.rawDisplay,
      normalized: c.excluded ? null : c.normalized,
      weight,
      contribution: round1(contribution),
      provenance: c.provenance,
      sourceRef: c.sourceRef,
      excluded: c.excluded,
      excludeReason: c.excludeReason,
    };
  });

  const exactTotal = withWeights.reduce((s, c) => s + c.contribution, 0);
  const total = clamp(exactTotal);
  reconcileDisplayedSum(withWeights, total);

  return {
    total,
    missingPolicy: MISSING_POLICY,
    missingPolicyNote,
    components: withWeights,
    label: extras?.label,
    scope: extras?.scope,
  };
}

function llmCandidates(input: {
  mentionRate: number | null;
  citationRate: number | null;
  avgPosition: number | null;
  usableResponses?: number;
}): Candidate[] {
  const llmRef = `llm-sample:${input.usableResponses ?? 0}`;
  const positionNormalized =
    input.avgPosition == null ? null : clamp(Math.max(0, 100 - (input.avgPosition - 1) * 25));
  return [
    {
      key: 'mentionRate',
      label: 'Mention rate',
      raw: input.mentionRate,
      rawDisplay: input.mentionRate == null ? 'N/A' : `${input.mentionRate}%`,
      normalized: input.mentionRate,
      targetWeight: AI_VISIBILITY_WEIGHTS.mentionRate,
      provenance: 'OBSERVED',
      sourceRef: llmRef,
      excluded: input.mentionRate == null,
      excludeReason: input.mentionRate == null ? 'No usable LLM responses' : undefined,
    },
    {
      key: 'citationRate',
      label: 'Citation rate',
      raw: input.citationRate,
      rawDisplay: input.citationRate == null ? 'N/A' : `${input.citationRate}%`,
      normalized: input.citationRate,
      targetWeight: AI_VISIBILITY_WEIGHTS.citationRate,
      provenance: 'OBSERVED',
      sourceRef: llmRef,
      excluded: input.citationRate == null,
      excludeReason: input.citationRate == null ? 'No usable LLM responses' : undefined,
    },
    {
      key: 'position',
      label: 'Avg. recommendation position',
      raw: input.avgPosition,
      rawDisplay: input.avgPosition == null ? 'N/A' : String(input.avgPosition),
      normalized: positionNormalized,
      targetWeight: AI_VISIBILITY_WEIGHTS.position,
      provenance: 'OBSERVED',
      sourceRef: llmRef,
      excluded: input.avgPosition == null,
      excludeReason:
        input.avgPosition == null
          ? 'Position is N/A — brand was not listed. Excluded; remaining AI-Visibility weights renormalized.'
          : undefined,
    },
  ];
}

function onSiteCandidates(input: {
  aeo: number | null;
  geo: number | null;
  technical: number | null;
  entityStrength: number | null;
  websiteUrl?: string;
}): Candidate[] {
  const crawlRef = `crawl:${input.websiteUrl || 'site'}`;
  return [
    {
      key: 'aeo',
      label: 'On-site AEO',
      raw: input.aeo,
      rawDisplay: input.aeo == null ? 'N/A' : String(input.aeo),
      normalized: input.aeo,
      targetWeight: ON_SITE_WEIGHTS.aeo,
      provenance: 'OBSERVED',
      sourceRef: crawlRef,
      excluded: input.aeo == null,
      excludeReason: input.aeo == null ? 'Crawl scores unavailable' : undefined,
    },
    {
      key: 'geo',
      label: 'On-site GEO',
      raw: input.geo,
      rawDisplay: input.geo == null ? 'N/A' : String(input.geo),
      normalized: input.geo,
      targetWeight: ON_SITE_WEIGHTS.geo,
      provenance: 'OBSERVED',
      sourceRef: crawlRef,
      excluded: input.geo == null,
      excludeReason: input.geo == null ? 'Crawl scores unavailable' : undefined,
    },
    {
      key: 'technical',
      label: 'Technical',
      raw: input.technical,
      rawDisplay: input.technical == null ? 'N/A' : String(input.technical),
      normalized: input.technical,
      targetWeight: ON_SITE_WEIGHTS.technical,
      provenance: 'OBSERVED',
      sourceRef: crawlRef,
      excluded: input.technical == null,
      excludeReason: input.technical == null ? 'Crawl scores unavailable' : undefined,
    },
    {
      key: 'entity',
      label: 'Entity strength',
      raw: input.entityStrength,
      rawDisplay: input.entityStrength == null ? 'N/A' : String(input.entityStrength),
      normalized: input.entityStrength,
      targetWeight: ON_SITE_WEIGHTS.entity,
      provenance: 'OBSERVED',
      sourceRef: crawlRef,
      excluded: input.entityStrength == null,
      excludeReason: input.entityStrength == null ? 'Crawl scores unavailable' : undefined,
    },
  ];
}

export function computeAiVisibilityScore(input: {
  mentionRate: number | null;
  citationRate: number | null;
  avgPosition: number | null;
  usableResponses?: number;
}): ScoreBreakdown {
  return assembleBreakdown(llmCandidates(input), AI_VIS_NOTE, {
    label: 'AI Visibility',
    scope: 'aiVisibility',
  });
}

export function computeOnSiteReadinessScore(input: {
  aeo: number | null;
  geo: number | null;
  technical: number | null;
  entityStrength: number | null;
  websiteUrl?: string;
}): ScoreBreakdown {
  return assembleBreakdown(onSiteCandidates(input), ON_SITE_NOTE, {
    label: 'On-site AI-readiness',
    scope: 'onSite',
  });
}

/**
 * Legacy mixed composite. Do not display on the cover.
 * Still uses the Part 2 7-component weights (cross-slice renormalization included).
 */
export function computeBuddyScore(input: {
  mentionRate: number | null;
  citationRate: number | null;
  avgPosition: number | null;
  aeo: number | null;
  geo: number | null;
  technical: number | null;
  entityStrength: number | null;
  websiteUrl?: string;
  usableResponses?: number;
}): ScoreBreakdown {
  const llm = llmCandidates(input).map((c) => ({
    ...c,
    targetWeight:
      c.key === 'mentionRate' ? 0.28 : c.key === 'citationRate' ? 0.18 : 0.12,
  }));
  const site = onSiteCandidates(input).map((c) => ({
    ...c,
    targetWeight: c.key === 'aeo' ? 0.16 : c.key === 'geo' ? 0.14 : c.key === 'technical' ? 0.08 : 0.04,
  }));
  return assembleBreakdown([...llm, ...site], LEGACY_NOTE, {
    label: 'Legacy BuddyScore',
    scope: 'legacyBuddyScore',
  });
}

export function displayedScore(breakdown: ScoreBreakdown): number | null {
  return breakdown.components.every((c) => c.excluded) ? null : breakdown.total;
}

/** Displayed 1-decimal contributions must add up to the integer total. */
export function reconcileDisplayedSum(components: ScoreComponent[], total: number): void {
  const included = components.filter((c) => !c.excluded);
  if (!included.length) return;
  const sum = round1(included.reduce((s, c) => s + c.contribution, 0));
  const diff = round1(total - sum);
  if (diff === 0) return;
  const target = included.reduce((best, c) => (c.contribution >= best.contribution ? c : best), included[0]);
  target.contribution = round1(target.contribution + diff);
}

export function displayedBreakdownSumsToTotal(breakdown: ScoreBreakdown): boolean {
  const sum = round1(breakdown.components.reduce((s, c) => s + c.contribution, 0));
  return sum === round1(breakdown.total);
}

export function buildDisplayedMetrics(input: {
  buddyScore: number | null;
  aiVisibility: number | null;
  onSiteReadiness: number | null;
  sampleSize: number;
  queriedLlms: number;
  usableLlms: number;
  responsesAnalyzed: number;
  mentionRate: number | null;
  citationRate: number | null;
  avgPosition: number | null;
  competitorsTracked: number;
  aeo: number | null;
  geo: number | null;
  technical: number | null;
  entityStrength: number | null;
  websiteUrl: string;
  aiVisibilityBreakdown: ScoreBreakdown;
  onSiteBreakdown: ScoreBreakdown;
}): DisplayedMetric[] {
  const crawlRef = `crawl:${input.websiteUrl}`;
  const llmRef = `llm-sample:${input.responsesAnalyzed}`;
  const metrics: DisplayedMetric[] = [
    {
      key: 'aiVisibility',
      label: 'AI Visibility',
      value: input.aiVisibility ?? 'N/A',
      provenance: 'ESTIMATED',
      sourceRef: 'formula:aiVisibility',
    },
    {
      key: 'onSiteReadiness',
      label: 'On-site AI-readiness',
      value: input.onSiteReadiness ?? 'N/A',
      provenance: 'ESTIMATED',
      sourceRef: 'formula:onSiteReadiness',
    },
    {
      key: 'buddyScore',
      label: 'Legacy BuddyScore',
      value: input.buddyScore ?? 'N/A',
      provenance: 'ESTIMATED',
      sourceRef: 'formula:buddyScore',
    },
    { key: 'sampleSize', label: 'Sample size (queries)', value: input.sampleSize, provenance: 'OBSERVED', sourceRef: 'run:prompts' },
    { key: 'platformsQueried', label: 'LLMs queried', value: input.queriedLlms, provenance: 'OBSERVED', sourceRef: 'run:providers' },
    { key: 'platformsUsable', label: 'LLMs usable', value: input.usableLlms, provenance: 'OBSERVED', sourceRef: 'run:providers' },
    { key: 'responsesAnalyzed', label: 'Responses analyzed', value: input.responsesAnalyzed, provenance: 'OBSERVED', sourceRef: llmRef },
    { key: 'mentionRate', label: 'Mention rate', value: input.mentionRate ?? 'N/A', provenance: 'OBSERVED', sourceRef: llmRef },
    { key: 'citationRate', label: 'Citation rate', value: input.citationRate ?? 'N/A', provenance: 'OBSERVED', sourceRef: llmRef },
    { key: 'avgPosition', label: 'Avg. position', value: input.avgPosition ?? 'N/A', provenance: 'OBSERVED', sourceRef: llmRef },
    { key: 'competitorsTracked', label: 'Competitors tracked', value: input.competitorsTracked, provenance: 'OBSERVED', sourceRef: llmRef },
    { key: 'aeo', label: 'AEO', value: input.aeo ?? 'N/A', provenance: 'OBSERVED', sourceRef: crawlRef },
    { key: 'geo', label: 'GEO', value: input.geo ?? 'N/A', provenance: 'OBSERVED', sourceRef: crawlRef },
    { key: 'technical', label: 'Technical', value: input.technical ?? 'N/A', provenance: 'OBSERVED', sourceRef: crawlRef },
    { key: 'entityStrength', label: 'Entity strength', value: input.entityStrength ?? 'N/A', provenance: 'OBSERVED', sourceRef: crawlRef },
    ...input.aiVisibilityBreakdown.components.map((c) => ({
      key: `aiVisibility.${c.key}`,
      label: c.label,
      value: c.excluded ? 'N/A' : c.contribution,
      provenance: c.provenance,
      sourceRef: c.sourceRef,
    })),
    ...input.onSiteBreakdown.components.map((c) => ({
      key: `onSite.${c.key}`,
      label: c.label,
      value: c.excluded ? 'N/A' : c.contribution,
      provenance: c.provenance,
      sourceRef: c.sourceRef,
    })),
  ];
  assertDisplayedMetricsTagged(metrics);
  return metrics;
}

export function assertDisplayedMetricsTagged(metrics: DisplayedMetric[]): void {
  if (!metrics.length) throw new Error('No displayed metrics were tagged with provenance');
  for (const m of metrics) {
    if (m.provenance !== 'OBSERVED' && m.provenance !== 'ESTIMATED') {
      throw new Error(`Unclassified metric "${m.key}" — provenance must be OBSERVED or ESTIMATED`);
    }
    if (!m.sourceRef) {
      throw new Error(`Metric "${m.key}" is missing sourceRef`);
    }
  }
}
