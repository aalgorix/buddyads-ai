'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const STEPS = [
  'Crawling your website',
  'Querying AI platforms',
  'Measuring mentions, citations, and competitors',
  'Scoring AEO, GEO, and technical readiness',
  'Writing your intelligence report',
];

type JobStatusResponse = {
  jobId: string;
  status: string;
  progressStep?: string | null;
  error?: string | null;
  reportUrl?: string | null;
  pdfUrl?: string | null;
  emailStatus?: string | null;
  scores?: { overall?: number; aeo?: number; geo?: number } | null;
};

export function ConfirmationScreen({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data = (await res.json()) as JobStatusResponse;
        if (!cancelled) setStatus(data);
        if (data.status === 'COMPLETED' || data.status === 'FAILED') return;
      } catch {
        // keep polling
      }
      if (!cancelled) timer = setTimeout(poll, 3000);
    };

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);

  const done = status?.status === 'COMPLETED';
  const failed = status?.status === 'FAILED';

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-center md:py-14">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
      >
        {done ? (
          <span className="text-2xl font-bold">✓</span>
        ) : (
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        )}
      </motion.div>

      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        {done ? 'Your report is ready!' : failed ? 'Analysis hit a snag' : 'Thank you!'}
      </h1>

      <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
        {done
          ? 'Your AI Visibility Intelligence Report is ready — how AI sees, recommends, and cites your brand.'
          : failed
            ? status?.error || 'Something went wrong while analyzing your site. Please try again.'
            : "Our agent has started analyzing your business. We're crawling your website, evaluating AI visibility, researching competitors, and preparing a personalized report."}
      </p>

      {!done && !failed && (
        <p className="mt-3 text-sm font-medium text-ink">
          You&apos;ll receive it by email shortly — usually within a few minutes.
        </p>
      )}

      {done && status?.scores && (
        <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3 text-sm">
          <ScoreChip label="Overall" value={status.scores.overall} />
          <ScoreChip label="AEO" value={status.scores.aeo} />
          <ScoreChip label="GEO" value={status.scores.geo} />
        </div>
      )}

      {done && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {status?.reportUrl && (
            <Link
              href={status.reportUrl}
              className="btn-gradient inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold"
            >
              View report
            </Link>
          )}
          {status?.pdfUrl && (
            <a
              href={status.pdfUrl}
              className="inline-flex h-11 items-center rounded-full border border-ink/10 px-6 text-sm font-semibold text-ink"
            >
              Download PDF
            </a>
          )}
        </div>
      )}

      {done && (
        <p className="mt-4 text-sm text-muted">Email status: {status?.emailStatus || 'pending'}</p>
      )}

      {!done && !failed && (
        <div className="mx-auto mt-10 max-w-md space-y-3 text-left">
          {STEPS.map((step, i) => (
            <motion.div
              key={step}
              className="flex items-center gap-3 rounded-2xl border border-line bg-soft/80 px-4 py-3 text-sm"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 2.2, delay: i * 0.2, repeat: Infinity }}
            >
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              {step}…
            </motion.div>
          ))}
          <p className="pt-2 text-center text-xs text-muted">
            Status: {status?.status || 'PENDING'}
            {status?.progressStep ? ` · ${status.progressStep}` : ''}
          </p>
        </div>
      )}

      <p className="mt-10 text-sm text-muted">
        Want to talk strategy?{' '}
        <Link href="/contact" className="font-semibold text-accent hover:opacity-80">
          Book a free AI strategy call
        </Link>
      </p>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-xl font-bold">{value ?? '—'}</p>
    </div>
  );
}

