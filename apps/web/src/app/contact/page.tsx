'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { Reveal } from '@/components/landing/reveal';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus('error');
      return;
    }
    // Frontend capture for now — wire to API/CRM when ready
    setStatus('sent');
  }

  const field =
    'h-12 w-full rounded-xl border border-ink/10 bg-white px-4 text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10';

  return (
    <div className="page-glow min-h-screen text-ink">
      <SiteHeader />

      <section className="hero-shell relative overflow-hidden border-b border-line px-6 py-16 md:px-10 md:py-24">
        <div className="orb float-a left-[-6%] top-10 h-64 w-64 bg-cyan/20" aria-hidden />
        <div className="orb float-b right-[-8%] bottom-0 h-72 w-72 bg-blush/15" aria-hidden />
        <div className="relative z-10 mx-auto max-w-site">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Contact</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold tracking-tight md:text-6xl">
            Let’s make AI recommend your brand
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Questions about audits, partnerships, or continuous visibility — send a note. Prefer a
            self-serve start? Run a report now.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-site gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="space-y-6">
              <div className="glass rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Email</p>
                <a
                  href="mailto:hello@buddyads.com"
                  className="mt-2 block font-display text-xl font-semibold text-ink hover:text-accent"
                >
                  hello@buddyads.com
                </a>
                <p className="mt-2 text-sm text-muted">
                  Use your real inbox when you go live — this is a placeholder.
                </p>
              </div>
              <div className="glass rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Self-serve</p>
                <p className="mt-2 font-display text-xl font-semibold">Run a free visibility audit</p>
                <Link href="/check-report" className="btn-gradient mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold">
                  Check Report
                </Link>
              </div>
              <div className="glass rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Solution</p>
                <p className="mt-2 text-sm text-muted">
                  See how Diagnose → Score → Prioritize → Ship works end to end.
                </p>
                <Link href="/solution" className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline">
                  Explore solution →
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <form onSubmit={onSubmit} className="glass rounded-3xl p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold">Send a message</h2>
              <p className="mt-2 text-sm text-muted">We’ll get back as soon as we can.</p>

              <div className="mt-8 grid gap-5">
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Name
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={field}
                  />
                </label>
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Work email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={field}
                  />
                </label>
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Company
                  <input value={company} onChange={(e) => setCompany(e.target.value)} className={field} />
                </label>
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Message
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="btn-gradient mt-6 inline-flex h-12 items-center rounded-xl px-8 text-sm font-semibold"
              >
                Send message
              </button>

              {status === 'sent' && (
                <p className="mt-4 text-sm font-medium text-emerald-700">
                  Thanks — message captured. (Backend email webhook can be connected next.)
                </p>
              )}
              {status === 'error' && (
                <p className="mt-4 text-sm font-medium text-rose-600">Please complete required fields.</p>
              )}
            </form>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
