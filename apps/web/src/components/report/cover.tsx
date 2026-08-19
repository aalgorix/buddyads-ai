import type { IntelligenceReport, ScoreBreakdown } from '@/lib/report-types';
import { formatDate, mentionRate, na, pct } from '@/lib/report-utils';
import { ReportHeaderBrand } from './report-header-brand';
import { Info } from './primitives';

export function ReportCover({ report }: { report: IntelligenceReport }) {
  const cov = report.coverage;
  const brandMentionPct = mentionRate(report.research);
  const queried = cov.platformsQueried ?? cov.platformsTested;
  const usable = cov.platformsUsable ?? report.platformPerformance.length;
  const competitorsAnalyzed = cov.competitorsTracked ?? report.competitors.length;
  const vis = report.scores.aiVisibility;
  const site = report.scores.onSiteReadiness;

  const kpis: { label: string; value: string; hint: string }[] = [
    {
      label: 'AI Platforms Tested',
      value: `${queried} queried / ${usable} usable`,
      hint: 'Distinct AI platforms queried vs platforms that returned usable answers.',
    },
    {
      label: 'Queries Tested',
      value: na(cov.queriesTransacted || null),
      hint: 'Unique buyer-style prompts sent to the tested models.',
    },
    {
      label: 'AI Responses Analyzed',
      value: na(cov.responsesAnalyzed || null),
      hint: 'Successful model answers (errors are excluded from this count).',
    },
    {
      label: 'Brand Mentions',
      value: pct(brandMentionPct),
      hint: 'Share of successful responses that named your brand.',
    },
    {
      label: 'Citation Rate',
      value: pct(report.ownCitationRate),
      hint: 'Share of successful responses that cited your own domain as a URL.',
    },
    {
      label: 'Competitors Analyzed',
      value: String(competitorsAnalyzed),
      hint: 'Validated competitor brands with at least two independent mentions in this sample.',
    },
  ];

  return (
    <section
      id="cover"
      className="relative overflow-hidden rounded-[2rem] bg-[#0b1220] px-6 py-12 text-[#f4f1ea] shadow-[0_40px_80px_-40px_rgba(11,18,32,0.7)] md:px-12 md:py-16"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c4a574] via-[#e8d5b0] to-[#c4a574]" />
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#c4a574]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[#2563eb]/10 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <ReportHeaderBrand inverted />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c4a574]">Confidential</p>
      </div>

      <p className="relative mt-12 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c4a574]">
        01  ·  Cover
      </p>
      <h1 className="relative mt-3 max-w-3xl font-serif text-4xl leading-[1.08] tracking-tight md:text-6xl">
        AI Visibility Intelligence Report
      </h1>
      <p className="relative mt-4 max-w-xl text-lg text-[#c5c8d0] md:text-xl">
        How AI sees, understands, recommends, and cites your brand
      </p>

      <div className="relative mt-10 border-t border-white/10 pt-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#9aa0ab]">Company</p>
        <p className="mt-1 font-serif text-3xl md:text-4xl">{report.brandName}</p>
        <p className="mt-2 text-sm text-[#9aa0ab]">{report.websiteUrl || 'N/A'}</p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-[#9aa0ab]">Report date</dt>
            <dd className="mt-1">{formatDate(report.generatedAt)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-[#9aa0ab]">Analysis ID</dt>
            <dd className="mt-1 truncate font-mono text-xs">{report.analysisId}</dd>
          </div>
        </dl>
      </div>

      <div className="relative mt-10 grid gap-4 md:grid-cols-2">
        <ScorePanel
          title="AI Visibility"
          value={na(vis)}
          confidence={report.confidence}
          reason={report.confidenceReason}
          footnote={`n = ${cov.sampleSize ?? cov.queriesTransacted} queries`}
          caveat={
            cov.sampleCaveat ||
            (cov.limitedSample
              ? `Limited sample — ${queried} LLM${queried === 1 ? '' : 's'} queried, ${usable} returned usable data. Directional only.`
              : null)
          }
          breakdown={report.aiVisibilityBreakdown}
        />
        <ScorePanel
          title="On-site AI-readiness"
          value={na(site)}
          confidence={report.onSiteConfidence || '—'}
          reason={report.onSiteConfidenceReason}
          footnote="From crawled URL · independent of LLM sample"
          caveat={null}
          breakdown={report.onSiteBreakdown}
        />
      </div>

      <div className="relative mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-[#0b1220] px-4 py-4">
            <p className="font-serif text-2xl">{k.value}</p>
            <p className="mt-1 text-[10px] uppercase leading-snug tracking-[0.12em] text-[#9aa0ab]">
              {k.label}
              <span className="ml-1 rounded border border-white/15 px-1 text-[8px] text-[#e8d5b0]">OBS</span>
              <Info text={k.hint} />
            </p>
          </div>
        ))}
      </div>

      <p className="relative mt-4 text-sm text-[#c5c8d0]">
        {report.categoryBenchmark?.available
          ? `Category benchmark (EST): typical ${pct(report.categoryBenchmark.typicalMentionRate)} mention rate · strong ${pct(report.categoryBenchmark.strongMentionRate)}`
          : report.categoryBenchmark?.note || 'No benchmark available for this category'}
      </p>
      {report.methodologyVersion ? (
        <p className="relative mt-2 text-[11px] uppercase tracking-[0.16em] text-[#9aa0ab]">
          Methodology {report.methodologyVersion}
        </p>
      ) : null}
    </section>
  );
}

function ScorePanel({
  title,
  value,
  confidence,
  reason,
  footnote,
  caveat,
  breakdown,
}: {
  title: string;
  value: string;
  confidence: string;
  reason?: string;
  footnote: string;
  caveat: string | null;
  breakdown?: ScoreBreakdown;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#c4a574]">{title}</p>
      <p className="mt-2 font-serif text-6xl leading-none tracking-tight md:text-7xl">{value}</p>
      <p className="mt-2 text-sm text-[#9aa0ab]">
        / 100
        <span className="ml-2 rounded border border-[#c4a574]/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#e8d5b0]">
          EST
        </span>
      </p>
      <p className="mt-3 text-sm">
        Confidence <span className="text-[#c4a574]">{confidence}</span>
      </p>
      {reason ? <p className="mt-2 text-xs leading-relaxed text-[#c5c8d0]">{reason}</p> : null}
      {caveat ? <p className="mt-3 text-xs leading-relaxed text-[#e8d5b0]">{caveat}</p> : null}
      <p className="mt-2 text-[11px] text-[#9aa0ab]">{footnote}</p>
      {breakdown ? <BreakdownTable breakdown={breakdown} /> : null}
    </div>
  );
}

function BreakdownTable({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <p className="text-[10px] uppercase tracking-wider text-[#9aa0ab]">{breakdown.missingPolicyNote}</p>
      <table className="mt-3 w-full text-left text-xs">
        <thead className="text-[10px] uppercase tracking-wider text-[#9aa0ab]">
          <tr>
            <th className="pb-2 font-medium">Component</th>
            <th className="pb-2 font-medium">Raw</th>
            <th className="pb-2 font-medium">Norm</th>
            <th className="pb-2 font-medium">Weight</th>
            <th className="pb-2 font-medium">Pts</th>
            <th className="pb-2 font-medium">Tag</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.components.map((c) => (
            <tr key={c.key} className="border-t border-white/10">
              <td className="py-1.5">{c.label}</td>
              <td className={c.excluded ? 'text-[#9aa0ab]' : ''}>{c.rawDisplay}</td>
              <td>{c.normalized == null ? 'excl.' : c.normalized}</td>
              <td>{Math.round(c.weight * 100)}%</td>
              <td>{c.contribution.toFixed(1)}</td>
              <td>
                <span className="rounded border border-white/20 px-1 text-[9px] text-[#c5c8d0]">
                  {c.provenance === 'OBSERVED' ? 'OBS' : 'EST'}
                </span>
              </td>
            </tr>
          ))}
          <tr className="border-t border-white/20 font-semibold">
            <td className="py-2" colSpan={4}>
              Total
            </td>
            <td>{breakdown.total}</td>
            <td>
              <span className="rounded border border-[#c4a574]/50 px-1 text-[9px] text-[#e8d5b0]">EST</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-[10px] uppercase tracking-wider text-[#9aa0ab]">
        Legend: OBS = observed · EST = derived / inferred
      </p>
    </div>
  );
}
