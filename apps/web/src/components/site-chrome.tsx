'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrandLockup } from './brand';

const links = [
  { href: '/solution', label: 'Solution' },
  { href: '/#capabilities', label: 'Capabilities' },
  { href: '/#workflow', label: 'How it works' },
  { href: '/#insights', label: 'Insights' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader({ checkHref = '/check-report' }: { checkHref?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-site items-center justify-between gap-4 px-6 py-3.5 md:px-10">
        <BrandLockup />

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-soft hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={checkHref}
            className="btn-gradient ml-2 rounded-full px-4 py-2 text-sm font-semibold"
          >
            Check Report
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Link href={checkHref} className="btn-gradient rounded-full px-3 py-2 text-xs font-semibold">
            Check Report
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink"
          >
            <span className="sr-only">Menu</span>
            <span className="flex w-4 flex-col gap-1">
              <span className={`h-0.5 w-full bg-ink transition ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
              <span className={`h-0.5 w-full bg-ink transition ${open ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-full bg-ink transition ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-ink hover:bg-soft"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={checkHref}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-soft px-3 py-3 text-sm font-semibold text-ink"
            >
              Check Report
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white/90 px-6 py-12 md:px-10">
      <div className="mx-auto flex max-w-site flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <BrandLockup size="sm" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            AI visibility & LLM optimization for brands that need to be recommended — not just ranked.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-muted">
          <Link href="/solution" className="hover:text-ink">
            Solution
          </Link>
          <Link href="/contact" className="hover:text-ink">
            Contact
          </Link>
          <Link href="/#insights" className="hover:text-ink">
            Insights
          </Link>
          <Link href="/check-report" className="hover:text-ink">
            Check Report
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-site text-xs text-muted/80">
        © {new Date().getFullYear()} BuddyAds. Reports sample model behavior for research.
      </p>
    </footer>
  );
}
