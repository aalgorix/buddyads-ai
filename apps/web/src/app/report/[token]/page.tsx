import { notFound } from 'next/navigation';
import { prisma } from '@buddyads/db';
import { BrandLockup } from '@/components/brand';

export const dynamic = 'force-dynamic';

type Payload = {
  brandName: string;
  websiteUrl: string;
  overall: number;
  aeo: number;
  geo: number;
  llmReady: number;
  grade: string;
  summary: string;
  recommendations: { title: string; detail: string; priority: string }[];
  research: {
    model: string;
    question: string;
    answer: string;
    brandMentioned: boolean;
    error?: string;
  }[];
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

  return (
    <div className="min-h-screen bg-white text-ink">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <BrandLockup size="sm" />
        <h1 className="mt-8 font-display text-4xl font-bold tracking-tight md:text-5xl">
          {report.brandName}
        </h1>
        <p className="mt-2 text-muted">{payload?.websiteUrl}</p>

        <div className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {[
            ['Overall', report.overall],
            ['AEO', report.aeo],
            ['GEO', report.geo],
            ['LLM readiness', report.llmReady],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-white p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
              <p className="mt-1 font-display text-3xl font-bold">{value as number}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-sm text-muted">
          Grade {report.grade} · Confidence {payload?.confidence || '—'}
        </p>

        <section className="mt-12 border-t border-line pt-8">
          <h2 className="font-display text-xl font-semibold">Summary</h2>
          <p className="mt-4 leading-relaxed text-ink/80">{report.summary}</p>
        </section>

        {recs.length > 0 && (
          <section className="mt-12 border-t border-line pt-8">
            <h2 className="font-display text-xl font-semibold">Priorities</h2>
            <ul className="mt-6 space-y-6">
              {recs.map((r) => (
                <li key={r.title} className="border-l-2 border-accent pl-4">
                  <p className="text-[11px] uppercase tracking-wider text-accent">{r.priority}</p>
                  <p className="mt-1 font-semibold">{r.title}</p>
                  <p className="mt-1 text-sm text-muted">{r.detail}</p>
                </li>
              ))}
            </ul>
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
      </div>
    </div>
  );
}
