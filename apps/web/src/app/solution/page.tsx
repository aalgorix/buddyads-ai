import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { Reveal, SectionHead } from '@/components/landing/reveal';

export const metadata: Metadata = {
  title: 'Solution',
  description:
    'BuddyAds AI Visibility solution — LLMO, GEO, multi-LLM research, and evidence-based reports.',
};

const pillars = [
  {
    title: 'Diagnose',
    body: 'Crawl your site and sample how major LLMs talk about your category, brand, and competitors.',
  },
  {
    title: 'Score',
    body: 'Get an AI Presence Score with AEO, GEO, and LLM readiness built from this run’s evidence.',
  },
  {
    title: 'Prioritize',
    body: 'Know which prompts, pages, and entity gaps matter most before you rewrite your entire site.',
  },
  {
    title: 'Ship wins',
    body: 'Act on recommendations that improve citation readiness — FAQ structure, schema, citable proof.',
  },
];

const deliverables = [
  'Multi-LLM research samples (via OpenRouter models you configure)',
  'Brand mention and competitor context from model answers',
  'On-site extractability signals from crawl',
  'Shareable private report link',
  'Email delivery when the worker finishes',
];

export default function SolutionPage() {
  return (
    <div className="page-glow min-h-screen text-ink">
      <SiteHeader />

      <section className="hero-shell relative overflow-hidden border-b border-line px-6 py-16 md:px-10 md:py-24">
        <div className="orb float-a right-[-10%] top-0 h-72 w-72 bg-accent/20" aria-hidden />
        <div className="orb float-b left-[-8%] bottom-0 h-64 w-64 bg-cyan/20" aria-hidden />
        <div className="relative z-10 mx-auto max-w-site">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Solution</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">
            The AI visibility system built for recommendation, not rankings
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Traditional SEO optimizes blue links. BuddyAds optimizes how ChatGPT, Gemini, Claude,
            Perplexity, and others discover, describe, and recommend your brand.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/check-report" className="btn-gradient rounded-full px-6 py-3 text-sm font-semibold">
              Check Report
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-ink/10 bg-white/80 px-6 py-3 text-sm font-semibold shadow-sm"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-site">
          <Reveal>
            <SectionHead
              eyebrow="How the solution works"
              title="A single agent loop that earns you clear next steps"
              description="Worker + tools + multi-LLM research. Simple architecture, serious product outcomes."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <article className="glass h-full rounded-3xl p-6 md:p-8">
                  <p className="text-xs font-semibold text-accent">{String(i + 1).padStart(2, '0')}</p>
                  <h2 className="mt-3 font-display text-2xl font-bold">{p.title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-soft border-y border-line px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-site gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHead
              eyebrow="What you receive"
              title="Every audit produces an evidence-backed report"
              description="Same structure for every brand. Different scores, research samples, and priorities for yours."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <ul className="glass space-y-4 rounded-3xl p-6 md:p-8">
              {deliverables.map((item) => (
                <li key={item} className="flex gap-3 text-sm font-medium text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan text-[11px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-site">
          <div className="glass overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-white to-sky-50 p-8 md:p-12">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Ready to see how AI talks about you?
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Run a free audit or contact the team to discuss continuous monitoring.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/check-report" className="btn-gradient rounded-full px-6 py-3 text-sm font-semibold">
                Start free audit
              </Link>
              <Link href="/contact" className="rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
