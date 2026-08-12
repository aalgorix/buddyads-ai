'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal, SectionHead } from './reveal';
import { VisibilityShowcase } from './visibility-graph';
import { InsightsTable } from './insights-table';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import Link from 'next/link';

const heroModels = ['ChatGPT', 'Gemini', 'Claude', 'Perplexity', 'Copilot', 'Grok', 'DeepSeek', 'Mistral'];
const heroFeatures = [
  { title: 'AI Presence Score', detail: 'One clear grade across assistants' },
  { title: 'Prompt coverage', detail: 'Know which buyer questions include you' },
  { title: 'Citation gaps', detail: 'See competitors AI trusts instead' },
];

const capabilities = [
  {
    title: 'AI Visibility Analysis',
    description: 'See whether your business appears in AI-generated answers — and why it does not.',
  },
  {
    title: 'LLM Brand Monitoring',
    description: 'Track where and how ChatGPT, Gemini, Claude, and others mention your brand.',
  },
  {
    title: 'AI Citation Optimization',
    description: 'Improve the likelihood that LLMs reference your company as a trusted source.',
  },
  {
    title: 'Prompt Performance',
    description: 'Test prompts across multiple AI platforms and compare recommendation rates.',
  },
  {
    title: 'AI Presence Score',
    description: 'One score for how visible your brand is across major AI assistants.',
  },
  {
    title: 'Competitor AI Analysis',
    description: 'Compare how rivals appear in AI answers — and where you can overtake them.',
  },
  {
    title: 'Knowledge Optimization',
    description: 'Structure content so AI models accurately understand your products and category.',
  },
  {
    title: 'AI Content Recommendations',
    description: 'Get precise fixes that increase discoverability inside LLM responses.',
  },
];

const workflow = [
  { title: 'Discover', description: 'Scan how AI assistants talk about your brand, category, and competitors.' },
  { title: 'Measure', description: 'Get your AI Presence Score, citation signals, and model-by-model visibility.' },
  { title: 'Optimize', description: 'Apply knowledge and content recommendations that LLMs can understand and cite.' },
  { title: 'Improve citations', description: 'Increase the rate at which AI recommends and references your brand.' },
  { title: 'Monitor continuously', description: 'Track visibility as models update — stay the brand AI trusts.' },
];

const comparison = [
  { label: 'Visibility target', old: 'Google & web SERPs', buddy: 'ChatGPT, Claude, Gemini & more' },
  { label: 'What you optimize', old: 'Keywords & backlinks', buddy: 'Citations, entities & prompts' },
  { label: 'Measurement', old: 'Rankings & traffic', buddy: 'AI Presence & recommendation rate' },
  { label: 'Competitor insight', old: 'Keyword gap reports', buddy: 'Who AI recommends — and why' },
  { label: 'Content strategy', old: 'Blog volume SEO', buddy: 'Knowledge LLMs can cite' },
  { label: 'Model coverage', old: 'Not applicable', buddy: 'Multi-LLM research samples' },
  { label: 'Answer inclusion', old: 'Featured snippets only', buddy: 'Conversational recommendations' },
  { label: 'Future-proofing', old: 'Search as it was', buddy: 'Search as AI is becoming' },
];

const models = [
  { name: 'ChatGPT', maker: 'OpenAI', description: 'Brand mentions, recommendations, and citation patterns in GPT answers.' },
  { name: 'Gemini', maker: 'Google', description: 'How Google’s AI surfaces your brand across prompts and follow-ups.' },
  { name: 'Claude', maker: 'Anthropic', description: 'Presence in Claude answers where precision and trust matter most.' },
  { name: 'Perplexity', maker: 'Perplexity', description: 'Whether you are cited as a source in AI search with grounding.' },
  { name: 'Microsoft Copilot', maker: 'Microsoft', description: 'Visibility inside Copilot experiences across work and web.' },
  { name: 'Grok', maker: 'xAI', description: 'How Grok talks about your category and competitors.' },
  { name: 'DeepSeek', maker: 'DeepSeek', description: 'Emerging models shaping global AI discovery.' },
  { name: 'Mistral', maker: 'Mistral AI', description: 'European and open-weight ecosystems that influence discovery.' },
  { name: 'Meta AI', maker: 'Meta', description: 'Brand presence across Meta’s AI assistants and surfaces.' },
];

const industries = [
  { title: 'Ecommerce', blurb: 'Become the product AI suggests when shoppers ask.' },
  { title: 'Healthcare', blurb: 'Earn accurate, trusted mentions in sensitive queries.' },
  { title: 'Education', blurb: 'Surface in AI answers about courses and careers.' },
  { title: 'Finance', blurb: 'Win recommendation slots for fintech and banking prompts.' },
  { title: 'Travel', blurb: 'Show up when AI plans trips and compares options.' },
  { title: 'Restaurants', blurb: 'Get cited for local and cuisine recommendations.' },
  { title: 'Real Estate', blurb: 'Appear in AI guidance for buyers and investors.' },
  { title: 'Automobile', blurb: 'Be the brand AI names for models and comparisons.' },
];

const testimonials = [
  {
    quote:
      'We had strong SEO and still never appeared in ChatGPT answers. BuddyAds showed us the citation gaps — within weeks, Claude and Perplexity started recommending us.',
    name: 'Maya Chen',
    role: 'CMO, Northline Commerce',
  },
  {
    quote:
      'Prompt performance testing across models replaced guesswork. We finally know which knowledge pages move our AI Presence Score.',
    name: 'Jordan Blake',
    role: 'Head of Growth, Vertex Labs',
  },
  {
    quote:
      'Competitor AI analysis was the unlock. We saw exactly which rivals AI trusted — and what content made the difference.',
    name: 'Sofia Ramirez',
    role: 'Founder, Atelier Home',
  },
  {
    quote:
      'This is not advertising. It is the new discovery layer. BuddyAds is how we stay visible as search becomes conversational.',
    name: 'Alex Okonkwo',
    role: 'VP Marketing, Pulse Health',
  },
];

const faqs = [
  {
    q: 'What is BuddyAds?',
    a: 'BuddyAds is an AI Visibility & LLM Optimization platform. We help businesses become discoverable, recommended, and cited by AI assistants like ChatGPT, Gemini, Claude, Perplexity, and more.',
  },
  {
    q: 'Is this advertising or SEO?',
    a: 'Neither in the traditional sense. We focus on LLMO (LLM Optimization) and GEO (Generative Engine Optimization) — improving how AI models understand and recommend your brand.',
  },
  {
    q: 'Which AI models do you research?',
    a: 'ChatGPT, Gemini, Claude, Perplexity, Microsoft Copilot, Grok, DeepSeek, Mistral, Meta AI — with coverage expanding as new assistants emerge.',
  },
  {
    q: 'What is an AI Presence Score?',
    a: 'A single metric that summarizes how visible your brand is across major AI assistants — combining mentions, citation signals, recommendation rate, and knowledge coverage from this run’s evidence.',
  },
  {
    q: 'How is this different from traditional SEO?',
    a: 'SEO optimizes for search engine results pages. BuddyAds optimizes for conversational AI answers — the prompts people ask when they want a recommendation, not a list of blue links.',
  },
  {
    q: 'Can I keep human control over changes?',
    a: 'Yes. We diagnose and recommend. You approve content and knowledge updates before they go live.',
  },
];

const stats = [
  { value: '9+', label: 'AI models in research set' },
  { value: 'LLMO', label: 'LLM Optimization focus' },
  { value: 'GEO', label: 'Generative engine readiness' },
  { value: '1', label: 'Unified visibility report' },
];

export function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [tIndex, setTIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTIndex((i) => (i + 1) % testimonials.length), 5500);
    return () => clearInterval(id);
  }, []);

  const active = testimonials[tIndex];

  return (
    <div className="page-glow min-h-screen text-ink">
      <SiteHeader />

      {/* ── RICH LIGHT HERO ── */}
      <section className="hero-shell relative min-h-[calc(100svh-4.5rem)] border-b border-line">
        <div className="orb float-a left-[-8%] top-[12%] h-72 w-72 bg-accent/25" aria-hidden />
        <div className="orb float-b right-[-6%] top-[30%] h-80 w-80 bg-cyan/20" aria-hidden />
        <div className="orb bottom-[8%] left-[30%] h-56 w-56 bg-blush/20" aria-hidden />

        <div className="relative z-10 mx-auto grid max-w-site gap-12 px-6 pb-16 pt-10 md:px-10 md:pb-20 md:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          {/* Left — copy cluster (filled) */}
          <div className="text-center lg:text-left">
            <p className="anim-hero-1 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-white/70 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-accent shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AI Search Operating System
            </p>
            <h1 className="anim-hero-2 mt-6 font-display text-[clamp(2.6rem,5.5vw,4.4rem)] font-bold leading-[1.05] tracking-tight text-ink">
              Be the brand
              <span className="block bg-gradient-to-r from-accent via-cyan to-blush bg-clip-text text-transparent">
                AI recommends
              </span>
            </h1>
            <p className="anim-hero-3 mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg lg:mx-0">
              Reverse engineer your AI search presence and grow visibility across ChatGPT, Gemini,
              Claude, Perplexity, and every assistant buyers already trust.
            </p>
            <div className="anim-hero-4 mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a href="/check-report" className="btn-gradient inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold">
                Check Report
              </a>
              <a
                href="#insights"
                className="inline-flex h-12 items-center rounded-full border border-ink/10 bg-white/80 px-7 text-sm font-semibold text-ink shadow-sm backdrop-blur transition hover:border-accent/30"
              >
                Explore insights
              </a>
            </div>

            <div className="anim-hero-5 mt-10 grid gap-3 sm:grid-cols-3">
              {heroFeatures.map((f) => (
                <div key={f.title} className="glass rounded-2xl px-4 py-3 text-left">
                  <p className="text-sm font-semibold text-ink">{f.title}</p>
                  <p className="mt-1 text-xs leading-snug text-muted">{f.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — product visual cluster (fills empty space) */}
          <div className="anim-hero-4 relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="glass relative overflow-hidden rounded-[1.75rem] p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Live snapshot</p>
                  <p className="mt-1 font-display text-lg font-bold text-ink">AI Presence Score</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  +12 this month
                </span>
              </div>

              <div className="mt-6 flex items-end gap-4">
                <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                  <div
                    className="ring-spin absolute inset-0 rounded-full"
                    style={{
                      background:
                        'conic-gradient(from 210deg, #2563eb 0%, #06b6d4 42%, #fb7185 70%, #e2e8f0 70%)',
                    }}
                    aria-hidden
                  />
                  <div className="absolute inset-[10px] rounded-full bg-white" />
                  <div className="relative text-center">
                    <p className="font-display text-3xl font-bold text-ink">68</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Score</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-3 pb-1">
                  {[
                    { l: 'Mention rate', v: '41%', w: '41%' },
                    { l: 'Citation quality', v: '54%', w: '54%' },
                    { l: 'Competitor gap', v: 'Closing', w: '62%' },
                  ].map((row) => (
                    <div key={row.l}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted">{row.l}</span>
                        <span className="font-semibold text-ink">{row.v}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-cyan"
                          style={{ width: row.w }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { t: 'ChatGPT', s: 'Cited', c: 'bg-emerald-50 text-emerald-700' },
                  { t: 'Gemini', s: 'Mentioned', c: 'bg-sky-50 text-sky-700' },
                  { t: 'Claude', s: 'Gap', c: 'bg-rose-50 text-rose-700' },
                  { t: 'Perplexity', s: 'Cited', c: 'bg-violet-50 text-violet-700' },
                ].map((m) => (
                  <div key={m.t} className="rounded-xl border border-line bg-white/80 px-3 py-2.5">
                    <p className="text-xs font-medium text-muted">{m.t}</p>
                    <p className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${m.c}`}>
                      {m.s}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-4 -left-3 hidden rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Next win</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">Add FAQ entities</p>
            </div>
            <div className="absolute -right-2 -top-3 hidden rounded-2xl border border-white/80 bg-gradient-to-br from-accent to-cyan px-4 py-3 text-white shadow-lg sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Share of voice</p>
              <p className="mt-0.5 text-sm font-bold">18% · climbing</p>
            </div>
          </div>
        </div>

        {/* Model marquee — fills bottom of hero */}
        <div className="relative z-10 border-t border-line/80 bg-white/40 py-5 backdrop-blur-sm">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Research coverage across assistants
          </p>
          <div className="overflow-hidden">
            <div className="marquee-track gap-3 px-4">
              {[...heroModels, ...heroModels].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="inline-flex shrink-0 items-center rounded-full border border-ink/8 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Smooth chart / rings under hero */}
      <VisibilityShowcase />

      <InsightsTable />

      <section className="border-y border-line bg-white/70">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4 md:px-10 md:py-14">
          {stats.map((s) => (
            <Reveal key={s.label}>
              <p className="bg-gradient-to-r from-accent to-cyan bg-clip-text font-display text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-site">
          <Reveal>
            <SectionHead
              eyebrow="Core capabilities"
              title="Everything you need to win AI search"
              description="LLM Optimization (LLMO) and Generative Engine Optimization (GEO) — purpose-built for conversational AI."
            />
          </Reveal>
          <div className="mt-14 grid gap-0 border-t border-line md:grid-cols-2">
            {capabilities.map((item, i) => (
              <Reveal key={item.title} delay={(i % 4) * 0.04}>
                <article className="border-b border-line py-8 md:odd:border-r md:odd:pr-10 md:even:pl-10">
                  <p className="text-xs font-semibold text-accent">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">{item.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="surface-soft border-y border-line px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-site">
          <Reveal>
            <SectionHead
              eyebrow="How it works"
              title="From invisible to recommended"
              description="A continuous loop for LLM Optimization — not a one-time audit."
            />
          </Reveal>
          <ol className="mt-14 max-w-3xl">
            {workflow.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.05}>
                <li className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-line py-7 md:grid-cols-[4.5rem_1fr]">
                  <span className="font-display text-2xl font-bold text-accent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-[15px] text-muted">{step.description}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Comparison */}
      <section id="why" className="px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-site">
          <Reveal>
            <SectionHead
              eyebrow="Why BuddyAds"
              title="Traditional SEO vs AI Visibility"
              description="SEO got you on Google. LLMO gets you recommended by AI assistants."
            />
          </Reveal>
          <div className="mt-12 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-gradient-to-r from-accent/[0.05] to-cyan/[0.05]">
                  <th className="py-4 pl-5 pr-4 font-medium text-muted" />
                  <th className="px-4 py-4 font-semibold text-muted">Traditional SEO</th>
                  <th className="bg-accent/5 px-4 py-4 font-semibold text-accent">BuddyAds AI Visibility</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-0">
                    <td className="py-3.5 pl-5 pr-4 font-medium">{row.label}</td>
                    <td className="px-4 py-3.5 text-muted">{row.old}</td>
                    <td className="bg-accent/[0.03] px-4 py-3.5 font-medium">{row.buddy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Models */}
      <section id="models" className="section-soft border-y border-line px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-site">
          <Reveal>
            <SectionHead
              eyebrow="Supported AI ecosystems"
              title="Optimize for the assistants people ask"
              description="These are analysis targets — the LLMs that recommend, cite, and shape brand discovery."
            />
          </Reveal>
          <div className="mt-12 columns-1 gap-x-12 sm:columns-2 lg:columns-3">
            {models.map((m, i) => (
              <Reveal key={m.name} delay={(i % 3) * 0.04}>
                <div className="mb-9 break-inside-avoid border-t border-line pt-4">
                  <p className="font-display text-lg font-semibold">{m.name}</p>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-accent">{m.maker}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{m.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-site">
          <Reveal>
            <SectionHead
              eyebrow="Industries"
              title="Built for brands that need to be found by AI"
              description="Whatever your category, AI assistants are already answering for your buyers."
            />
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
            {industries.map((item, i) => (
              <Reveal key={item.title} delay={(i % 4) * 0.04}>
                <p className="font-display text-lg font-semibold">{item.title}</p>
                <p className="mt-2 text-sm text-muted">{item.blurb}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-soft border-y border-line px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-site">
          <Reveal>
            <SectionHead
              eyebrow="Testimonials"
              title="Teams winning the AI recommendation era"
              description="Operators optimizing for LLMs — not buying traditional ads."
            />
          </Reveal>
          <div className="relative mx-auto mt-12 max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={active.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="glass rounded-3xl p-8 md:p-10"
              >
                <p className="font-display text-2xl font-medium leading-snug tracking-tight text-ink md:text-3xl">
                  “{active.quote}”
                </p>
                <footer className="mt-7">
                  <cite className="not-italic text-sm font-semibold text-ink">{active.name}</cite>
                  <p className="mt-1 text-sm text-muted">{active.role}</p>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
            <div className="mt-8 flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show testimonial ${i + 1}`}
                  onClick={() => setTIndex(i)}
                  className={`h-1 flex-1 transition ${i === tIndex ? 'bg-accent' : 'bg-ink/10'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-site">
          <Reveal>
            <SectionHead
              eyebrow="FAQ"
              title="Clear answers about AI visibility"
              description="What we are — and what we are not."
            />
          </Reveal>
          <div className="mx-auto mt-12 max-w-2xl divide-y divide-line border-y border-line">
            {faqs.map((item, i) => {
              const open = faqOpen === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-6 py-5 text-left"
                    aria-expanded={open}
                    onClick={() => setFaqOpen(open ? null : i)}
                  >
                    <span className="font-display text-lg font-semibold tracking-tight">{item.q}</span>
                    <span className="mt-1 text-accent" aria-hidden>
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-[15px] leading-relaxed text-muted">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-soft border-t border-line px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-site">
          <Reveal>
            <div className="glass overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-white to-sky-50 p-8 md:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Start free</p>
              <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight md:text-5xl">
                Ready to be the brand AI recommends?
              </h2>
              <p className="mt-4 max-w-xl text-base text-muted md:text-lg">
                Start measuring your AI Visibility Score today. Your private report is built from
                this run’s crawl and multi-LLM research.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/check-report"
                  className="btn-gradient inline-flex h-12 items-center rounded-full px-8 text-sm font-semibold"
                >
                  Check Report
                </Link>
                <Link
                  href="/solution"
                  className="inline-flex h-12 items-center rounded-full border border-ink/10 bg-white px-8 text-sm font-semibold"
                >
                  See solution
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
