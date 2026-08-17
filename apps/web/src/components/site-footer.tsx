'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/logo';
import { advertiserUrl, docsUrl, signUpUrl } from '@/lib/urls';

const columns = [
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/support', label: 'Support' },
      { href: '/careers', label: 'Careers' },
    ],
  },
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/solutions', label: 'Solutions' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/#models', label: 'AI Models' },
      { href: advertiserUrl, label: 'App Login' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/resources', label: 'Resource Hub' },
      { href: '/docs', label: 'Documentation' },
      { href: docsUrl, label: 'Developer Portal' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/security', label: 'Security' },
    ],
  },
];

const social = [
  { href: 'https://twitter.com', label: 'X' },
  { href: 'https://linkedin.com', label: 'LinkedIn' },
  { href: 'https://github.com', label: 'GitHub' },
  { href: 'https://youtube.com', label: 'YouTube' },
];

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="relative border-t border-black/[0.06] bg-[#FAFAFA] dark:border-white/10 dark:bg-card">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI Visibility & LLM Optimization. Help your brand get discovered, recommended, and
              cited by AI assistants — not traditional ads.
            </p>
            <form
              className="mt-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                setSubmitted(true);
                setEmail('');
              }}
            >
              <label htmlFor="newsletter" className="text-sm font-medium text-foreground">
                Newsletter
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="newsletter"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="h-11 flex-1 rounded-full border border-black/[0.08] bg-white px-4 text-sm outline-none ring-brand transition focus:ring-2 dark:border-white/10 dark:bg-background"
                  aria-describedby="newsletter-status"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
                  aria-label="Subscribe to newsletter"
                >
                  Join
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <p id="newsletter-status" className="mt-2 text-xs text-muted-foreground" role="status">
                {submitted ? 'Thanks — you are on the list.' : 'LLMO insights. No spam.'}
              </p>
            </form>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-foreground">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-black/[0.06] pt-8 dark:border-white/10 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BuddyAds.ai. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
            <Link
              href={signUpUrl}
              className="text-xs font-medium text-brand transition-colors hover:opacity-80"
            >
              Check Visibility →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
