import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@buddyads/db';
import { BrandLockup } from '@/components/brand';

export const dynamic = 'force-dynamic';

const DISCLAIMER =
  'LLM-related scores are evidence-based estimates from website signals and sampled model answers — not private model rankings.';

type Payload = {
  brandName: string;
  websiteUrl: string;
  overall: number;
  aeo: number;
  geo: number;
  llmReady: number;
  grade: string;
  summary: string;
  recommendations: {
    title: string;
    detail: string;
    priority: string;
    category?: string;
    reason?: string;
    businessImpact?: string;
    difficulty?: string;
    estimatedTime?: string;
    expectedGain?: string;
  }[];
  research: {
    model: string;
    question: string;
    answer: string;
    brandMentioned: boolean;
    error?: string;
  }[];
  llmEstimates?: { model: string; score: number; insight: string }[];
  roadmap30Day?: string[];
  roadmap90Day?: string[];
  competitorInsights?: string;
  confidence: string;
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await prisma.report.findUnique({ where: { token } });
  if (!report) notFound();

  let payload: Payload | null = null;
  try {
    payload = JSON.parse(report.payload) as Payload;
  } catch {
    payload = null;
  }

  const recs = payload?.recommendations || [];
  const research = (payload?.research || []).filter((r) => r.answer || r.error);
  const estimates = payload?.llmEstimates || [];
  const roadmap30 = payload?.roadmap30Day || [];
  const roadmap90 = payload?.roadmap90Day || [];

  return (
    <div className="min-h-screen bg-white text-ink">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <BrandLockup size="sm" />
        <p className="mt-8 text-sm font-semibold text-accent">BuddyAds AI Visibility Report</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
          {report.brandName}
        </h1>
        <p className="mt-2 text-muted">{payload?.websiteUrl}</p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Overall', report.overall],
            ['AEO', report.aeo],
            ['GEO', report.geo],
            ['LLM readiness', report.llmReady],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-line bg-soft/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
              <p className="mt-1 font-display text-3xl font-bold">{value as number}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-sm text-muted">
          Grade {report.grade} · Confidence {payload?.confidence || '—'}
        </p>

        <section className="mt-12 rounded-3xl border border-line bg-soft/50 p-6">
          <h2 className="font-display text-xl font-semibold">Executive summary</h2>
          <p className="mt-4 leading-relaxed text-ink/80">{report.summary}</p>
        </section>

        {recs.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-semibold">Priority recommendations</h2>
            <div className="mt-6 space-y-4">
              {recs.map((r) => (
                <article key={r.title} className="rounded-2xl border border-line bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                    {r.priority}
                    {r.category ? ` · ${r.category}` : ''}
                  </p>
                  <p className="mt-2 font-semibold">{r.title}</p>
                  <p className="mt-1 text-sm text-muted">{r.reason || r.detail}</p>
                  {r.businessImpact && (
                    <p className="mt-2 text-sm">
                      <span className="font-medium">Impact:</span> {r.businessImpact}
                    </p>
                  )}
                  {(r.difficulty || r.estimatedTime || r.expectedGain) && (
                    <p className="mt-1 text-sm text-muted">
                      {[r.difficulty, r.estimatedTime, r.expectedGain].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {estimates.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-semibold">LLM visibility estimates</h2>
            <p className="mt-2 text-xs text-muted">{DISCLAIMER}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {estimates.map((m) => (
                <div key={m.model} className="rounded-2xl border border-line p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{m.model}</p>
                    <p className="font-display text-xl font-bold">{m.score}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted">{m.insight}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(roadmap30.length > 0 || roadmap90.length > 0) && (
          <section className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-line p-5">
              <h2 className="font-semibold">30-day roadmap</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {roadmap30.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line p-5">
              <h2 className="font-semibold">90-day roadmap</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {roadmap90.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {payload?.competitorInsights && (
          <section className="mt-12 rounded-2xl border border-line p-5">
            <h2 className="font-semibold">Competitor insights</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{payload.competitorInsights}</p>
          </section>
        )}

        {research.length > 0 && (
          <section className="mt-12 border-t border-line pt-8">
            <h2 className="font-display text-xl font-semibold">LLM research samples</h2>
            <div className="mt-6 space-y-8">
              {research.slice(0, 12).map((r, i) => (
                <article key={`${r.model}-${i}`} className="border-t border-line pt-5">
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-muted">
                    <span>{r.model}</span>
                    <span>{r.brandMentioned ? 'Brand mentioned' : 'No brand mention'}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{r.question}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {r.error || r.answer.slice(0, 600)}
                    {!r.error && r.answer.length > 600 ? '…' : ''}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          {report.pdfPath && (
            <a
              href={`/api/reports/${token}/pdf`}
              className="btn-gradient inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold"
            >
              Download PDF
            </a>
          )}
          <Link
            href="/contact"
            className="inline-flex h-11 items-center rounded-full border border-ink/10 px-6 text-sm font-semibold"
          >
            Book a Free AI Strategy Call
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
