'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { IntelligenceReport } from '@/lib/report-types';
import { TOC } from '@/lib/report-utils';
import { ReportCover } from './cover';
import { ReportSections } from './sections';

export function ReportView({ report }: { report: IntelligenceReport }) {
  const [active, setActive] = useState('cover');

  useEffect(() => {
    const ids = TOC.map((t) => t.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]?.target.id) setActive(vis[0].target.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.2, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="report-root min-h-screen bg-[#f4f1ea] text-[#14161c]">
      <header className="sticky top-0 z-40 border-b border-[#e4dfd4] bg-[#f4f1ea]/90 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{report.brandName}</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8b8680]">AI Visibility Intelligence</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {report.pdfAvailable && report.token && (
              <a
                href={`/api/reports/${report.token}/pdf`}
                className="hidden h-10 items-center rounded-full border border-[#14161c]/10 px-4 text-sm font-semibold sm:inline-flex"
              >
                Download PDF
              </a>
            )}
            <Link
              href="/contact"
              className="inline-flex h-10 items-center rounded-full bg-[#0b1220] px-4 text-sm font-semibold text-[#f4f1ea]"
            >
              Strategy call
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[92rem] gap-0 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
        <aside className="sticky top-[57px] hidden max-h-[calc(100vh-57px)] overflow-y-auto border-r border-[#e4dfd4] px-4 py-8 lg:block print:hidden">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b8680]">Contents</p>
          <nav className="mt-3 space-y-0.5">
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`flex gap-2 rounded-lg px-2 py-1.5 text-[12px] leading-snug transition ${
                  active === item.id ? 'bg-white text-[#14161c] shadow-sm' : 'text-[#5c616b] hover:text-[#14161c]'
                }`}
              >
                <span className="w-5 shrink-0 font-mono text-[10px] text-[#b08950]">{item.n}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="px-4 py-8 md:px-10 md:py-12">
          <ReportCover report={report} />
          <div className="mx-auto max-w-5xl">
            <ReportSections report={report} />

            <div className="mt-8 flex flex-wrap gap-3 border-t border-[#e4dfd4] py-12 print:hidden">
              {report.pdfAvailable && report.token && (
                <a
                  href={`/api/reports/${report.token}/pdf`}
                  className="inline-flex h-11 items-center rounded-full bg-[#0b1220] px-6 text-sm font-semibold text-[#f4f1ea]"
                >
                  Download PDF
                </a>
              )}
              <Link
                href="/contact"
                className="inline-flex h-11 items-center rounded-full border border-[#14161c]/15 px-6 text-sm font-semibold"
              >
                Book a Free AI Strategy Call
              </Link>
            </div>
            <p className="pb-16 text-xs leading-relaxed text-[#8b8680]">
              BuddyScore is a proprietary BuddyAds.ai measurement based on observable AI responses and website signals.
              It is not an internal ranking score provided by OpenAI, Google, Anthropic, Perplexity, or any other AI
              provider.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
