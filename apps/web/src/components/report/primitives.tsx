import type { ReactNode } from 'react';
import { na, scoreTone } from '@/lib/report-utils';

export function Info({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <span
        tabIndex={0}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-current/20 text-[10px] font-semibold leading-none opacity-55"
        aria-label={text}
      >
        i
      </span>
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-56 -translate-x-1/2 rounded-lg bg-[#0b1220] px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-white/90 opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}

export function NA({ children }: { children?: ReactNode }) {
  return <span className="font-medium tracking-wide text-[#8b8680]">{children ?? 'N/A'}</span>;
}

export function Metric({ value, suffix = '' }: { value: number | string | null | undefined; suffix?: string }) {
  if (value == null || value === '') return <NA />;
  return (
    <>
      {value}
      {suffix}
    </>
  );
}

export function Section({
  id,
  number,
  eyebrow,
  title,
  lede,
  children,
}: {
  id: string;
  number: string;
  eyebrow?: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="report-section scroll-mt-24 border-t border-[#e4dfd4] py-16 md:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b08950]">
            {number}
            {eyebrow ? `  ·  ${eyebrow}` : ''}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-normal tracking-tight text-[#14161c] md:text-4xl">{title}</h2>
          {lede && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#5c616b]">{lede}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
  large,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  large?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-[#e4dfd4] bg-white/70 p-5 ${large ? 'md:p-7' : ''}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8680]">
        {label}
        <Info text={hint} />
      </p>
      <p className={`mt-2 font-serif tracking-tight text-[#14161c] ${large ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'}`}>
        {value}
      </p>
    </div>
  );
}

export function Callout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside className="rounded-2xl border border-[#e4dfd4] border-l-4 border-l-[#c4a574] bg-[#faf8f3] px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b08950]">{label}</p>
      <div className="mt-2 text-sm leading-relaxed text-[#3d4148]">{children}</div>
    </aside>
  );
}

export function Evidence({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-[#5c616b]">
      <span className="font-semibold text-[#14161c]">Evidence. </span>
      {children}
    </p>
  );
}

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const cls =
    tone === 'good'
      ? 'bg-emerald-50 text-emerald-800'
      : tone === 'warn'
        ? 'bg-amber-50 text-amber-900'
        : tone === 'bad'
          ? 'bg-rose-50 text-rose-800'
          : 'bg-[#efece4] text-[#3d4148]';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
}

export function ScoreBar({ label, value, dominate }: { label: string; value: number | null; dominate?: boolean }) {
  const tone = scoreTone(value);
  const width = value == null ? 0 : Math.max(4, Math.min(100, value));
  const color =
    tone === 'high' ? 'bg-emerald-600' : tone === 'mid' ? 'bg-[#2563eb]' : tone === 'low' ? 'bg-[#b45309]' : 'bg-[#d4cfc4]';
  return (
    <div className={dominate ? 'rounded-2xl border border-[#e4dfd4] bg-white p-5' : ''}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`font-medium ${dominate ? 'font-serif text-lg' : 'text-sm'}`}>{label}</p>
        <p className={`tabular-nums ${dominate ? 'font-serif text-4xl' : 'text-sm font-semibold'}`}>{na(value)}</p>
      </div>
      <div className={`mt-2 h-1.5 overflow-hidden rounded-full bg-[#ece8df] ${dominate ? 'h-2.5' : ''}`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  empty = 'Insufficient data',
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e4dfd4] px-5 py-8 text-center text-sm text-[#8b8680]">
        {empty}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#e4dfd4] bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#e4dfd4] bg-[#faf8f3] text-[11px] uppercase tracking-[0.12em] text-[#8b8680]">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#f0ebe3] last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-[#3d4148]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#e4dfd4] bg-white/50 px-5 py-10 text-center text-sm text-[#8b8680]">
      {children}
    </div>
  );
}
