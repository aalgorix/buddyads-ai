'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { ConfirmationScreen } from '@/components/confirmation';

const AI_PLATFORMS = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'copilot', label: 'Copilot' },
  { id: 'grok', label: 'Grok' },
] as const;

const steps = [
  { n: '01', t: 'Tell us your business', d: 'More context = smarter multi-LLM questions.' },
  { n: '02', t: 'Agent researches', d: 'Crawl + model samples across the assistants you care about.' },
  { n: '03', t: 'Report by email', d: 'Private link with scores, gaps, and priorities.' },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  businessDescription: string;
  productsServices: string;
  idealCustomers: string;
  countries: string;
  competitors: string;
  marketingChallenge: string;
  aiPlatforms: string[];
};

const initial: FormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  website: '',
  businessDescription: '',
  productsServices: '',
  idealCustomers: '',
  countries: '',
  competitors: '',
  marketingChallenge: '',
  aiPlatforms: ['chatgpt', 'gemini', 'claude'],
};

export default function CheckReportPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [jobId, setJobId] = useState('');

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function togglePlatform(id: string) {
    setForm((f) => {
      const has = f.aiPlatforms.includes(id);
      if (has && f.aiPlatforms.length === 1) return f;
      return {
        ...f,
        aiPlatforms: has ? f.aiPlatforms.filter((p) => p !== id) : [...f.aiPlatforms, id],
      };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.message || 'Could not start analysis');
        return;
      }
      setStatus('ok');
      setJobId(data.jobId);
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  const field =
    'h-12 w-full rounded-xl border border-ink/10 bg-white px-4 text-ink outline-none transition placeholder:text-muted/45 focus:border-accent focus:ring-4 focus:ring-accent/10';
  const area =
    'w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/45 focus:border-accent focus:ring-4 focus:ring-accent/10';
  const label = 'text-xs font-semibold uppercase tracking-wider text-muted';

  return (
    <div className="page-glow min-h-screen text-ink">
      <SiteHeader checkHref="/check-report" />

      <main className="relative overflow-hidden">
        <div className="orb float-a pointer-events-none left-[-12%] top-20 h-80 w-80 bg-accent/20" aria-hidden />
        <div className="orb float-b pointer-events-none right-[-10%] top-40 h-96 w-96 bg-cyan/15" aria-hidden />

        <div className="relative z-10 mx-auto grid max-w-site gap-12 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[0.9fr_1.15fr] lg:gap-14 lg:py-16">
          <div className="lg:sticky lg:top-24 lg:self-start lg:pt-2">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-accent shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Free AI visibility audit
            </motion.p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl">
              Check your AI{' '}
              <span className="bg-gradient-to-r from-accent via-cyan to-blush bg-clip-text text-transparent">
                Visibility Report
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg">
              Same depth as a full consultation brief: business context, markets, competitors, and AI
              platforms — so research is about your brand, not a generic crawl.
            </p>

            <ul className="mt-10 space-y-5">
              {steps.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-cyan text-xs font-bold text-white shadow-md">
                    {s.n}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{s.t}</p>
                    <p className="mt-0.5 text-sm text-muted">{s.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.65 }}
            className="relative"
          >
            <div
              className="absolute -inset-px rounded-[1.85rem] bg-gradient-to-br from-accent/40 via-cyan/30 to-blush/30 opacity-80 blur-[1px]"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_30px_80px_-40px_rgba(37,99,235,0.45)] backdrop-blur-xl md:p-8">
              {status === 'ok' && jobId ? (
                <ConfirmationScreen jobId={jobId} />
              ) : (
                <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Start free</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-ink">Visibility intake</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  ~5–15 min
                </span>
              </div>

              <form onSubmit={onSubmit} className="mt-7 space-y-8">
                {/* Contact */}
                <fieldset>
                  <legend className="font-display text-sm font-bold text-ink">Contact</legend>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 sm:col-span-1">
                      <span className={label}>Your name *</span>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className={field}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className={label}>Work email *</span>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        className={field}
                        placeholder="you@company.com"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className={label}>Phone</span>
                      <input
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        className={field}
                        placeholder="+1 …"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className={label}>Company name *</span>
                      <input
                        required
                        value={form.company}
                        onChange={(e) => setField('company', e.target.value)}
                        className={field}
                      />
                    </label>
                  </div>
                </fieldset>

                {/* Website & market */}
                <fieldset>
                  <legend className="font-display text-sm font-bold text-ink">Website & market</legend>
                  <div className="mt-4 grid gap-4">
                    <label className="grid gap-2">
                      <span className={label}>Website URL *</span>
                      <input
                        required
                        value={form.website}
                        onChange={(e) => setField('website', e.target.value)}
                        className={field}
                        placeholder="https://yourbrand.com"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className={label}>What does your business do? *</span>
                      <textarea
                        required
                        rows={3}
                        value={form.businessDescription}
                        onChange={(e) => setField('businessDescription', e.target.value)}
                        className={area}
                        placeholder="Briefly describe your business"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className={label}>Products or services *</span>
                      <textarea
                        required
                        rows={2}
                        value={form.productsServices}
                        onChange={(e) => setField('productsServices', e.target.value)}
                        className={area}
                        placeholder="e.g. AI analytics for marketers"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className={label}>Ideal customers *</span>
                      <input
                        required
                        value={form.idealCustomers}
                        onChange={(e) => setField('idealCustomers', e.target.value)}
                        className={field}
                        placeholder="e.g. mid-market SaaS founders"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2">
                        <span className={label}>Countries you serve</span>
                        <input
                          value={form.countries}
                          onChange={(e) => setField('countries', e.target.value)}
                          className={field}
                          placeholder="e.g. United States, India, UAE"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className={label}>Main competitors</span>
                        <input
                          value={form.competitors}
                          onChange={(e) => setField('competitors', e.target.value)}
                          className={field}
                          placeholder="Comma-separated names"
                        />
                      </label>
                    </div>
                    <label className="grid gap-2">
                      <span className={label}>Biggest marketing / visibility challenge</span>
                      <textarea
                        rows={2}
                        value={form.marketingChallenge}
                        onChange={(e) => setField('marketingChallenge', e.target.value)}
                        className={area}
                        placeholder="e.g. Not showing up when buyers ask AI for recommendations"
                      />
                    </label>
                  </div>
                </fieldset>

                {/* AI platforms */}
                <fieldset>
                  <legend className="font-display text-sm font-bold text-ink">
                    AI platforms to prioritize
                  </legend>
                  <p className="mt-1 text-xs text-muted">Select all that matter for your buyers.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {AI_PLATFORMS.map((p) => {
                      const on = form.aiPlatforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                            on
                              ? 'border-accent/30 bg-accent/10 text-accent'
                              : 'border-ink/10 bg-white text-muted hover:border-ink/20'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-gradient inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  {status === 'loading' ? 'Starting analysis…' : 'Generate my report'}
                </button>
              </form>

              {message && (
                <div
                  className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                    status === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <p>{message}</p>
                </div>
              )}

              <p className="mt-6 text-center text-xs leading-relaxed text-muted">
                We email the report to the work address you provide. Worker must be running for analysis
                to complete.
              </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
