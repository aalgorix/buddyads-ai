import { BrandLockup } from '@/components/brand';
import type { IntelligenceReport } from '@/lib/report-types';
import { formatDate, mentionRate, na, pct } from '@/lib/report-utils';
import { Info } from './primitives';

export function ReportCover({ report }: { report: IntelligenceReport }) {
  const score = report.scores.buddyScore ?? report.overall;
  const cov = report.coverage;
  const brandMentionPct = mentionRate(report.research);
  const competitorsAnalyzed = cov.brandsTracked > 0 ? Math.max(0, cov.brandsTracked - 1) : null;

  const kpis: { label: string; value: string; hint: string }[] = [
    {
      label: 'AI Platforms Tested',
      value: na(cov.platformsTested || null),
      hint: 'Count of distinct AI platforms that were actually queried in this analysis.',
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
      value: competitorsAnalyzed == null ? 'N/A' : String(competitorsAnalyzed),
      hint: 'Tracked competitor names from intake plus brands observed in answers, excluding you.',
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
        <BrandLockup size="sm" href="/" inverted />
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

      <div className="relative mt-10 grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
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

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#c4a574]">BuddyScore</p>
          <p className="mt-2 font-serif text-7xl leading-none tracking-tight md:text-8xl">{na(score)}</p>
          <p className="mt-2 text-sm text-[#9aa0ab]">/ 100 · AI Visibility</p>
          <p className="mt-4 text-sm">
            Grade <span className="text-[#c4a574]">{report.grade}</span>
            <span className="mx-2 text-white/20">·</span>
            Confidence <span className="text-[#c4a574]">{report.confidence}</span>
          </p>
        </div>
      </div>

      <div className="relative mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-[#0b1220] px-4 py-4">
            <p className="font-serif text-2xl">{k.value}</p>
            <p className="mt-1 text-[10px] uppercase leading-snug tracking-[0.12em] text-[#9aa0ab]">
              {k.label}
              <Info text={k.hint} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
