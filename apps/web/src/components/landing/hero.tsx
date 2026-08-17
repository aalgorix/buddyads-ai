'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  Brain,
  Quote,
  Radar,
  Sparkles,
  Target,
} from 'lucide-react';
import { checkVisibilityUrl } from '@/lib/urls';
import { easeOut } from '@/lib/motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hero-glow" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-50" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 md:pb-28 md:pt-24 lg:grid-cols-2 lg:gap-16 lg:pb-32">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden />
            AI Visibility & LLM Optimization
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: easeOut }}
            className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[4.5rem] lg:leading-[1.05]"
          >
            Become the Brand AI Recommends
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: easeOut }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            Monitor, optimize, and grow your visibility across ChatGPT, Gemini, Claude,
            Perplexity, Copilot, Grok, and the next generation of AI assistants.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22, ease: easeOut }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link
              href={checkVisibilityUrl}
              className="group inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background transition-all hover:scale-[1.02] hover:opacity-90"
            >
              Check My AI Visibility
              <span className="ml-2 transition-transform group-hover:translate-x-0.5" aria-hidden>
                →
              </span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-full border border-black/[0.1] bg-white/60 px-8 text-base font-medium text-foreground backdrop-blur transition-all hover:border-black/20 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
            >
              Book a Demo
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 text-sm text-muted-foreground"
          >
            LLMO · GEO · AI Search Visibility — not traditional ads
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: easeOut }}
          className="relative"
          aria-hidden
        >
          <HeroDashboard />
        </motion.div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/90 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-background/90 sm:hidden">
        <div className="flex gap-2">
          <Link
            href={checkVisibilityUrl}
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background"
          >
            Check Visibility
          </Link>
          <Link
            href="/contact"
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-black/[0.1] text-sm font-medium dark:border-white/15"
          >
            Book Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroDashboard() {
  const models = [
    { name: 'ChatGPT', score: 86 },
    { name: 'Gemini', score: 74 },
    { name: 'Claude', score: 81 },
    { name: 'Perplexity', score: 69 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#6C63FF]/20 via-transparent to-[#3B82F6]/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-3xl border border-black/[0.08] bg-white premium-shadow-lg dark:border-white/10 dark:bg-card">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">AI Visibility Studio</p>
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Scanning
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <motion.div
            className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-background/50 sm:col-span-2"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Radar className="h-4 w-4 text-brand" />
                AI Visibility Score
              </div>
              <span className="text-xs text-success">↑ 12 pts this week</span>
            </div>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-semibold tracking-tight">78</p>
              <div className="mb-1.5 h-2.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <motion.div
                  className="h-full rounded-full gradient-bg"
                  animate={{ width: ['45%', '78%', '68%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {models.map((m, i) => (
                <div key={m.name} className="rounded-xl bg-white p-2 text-center dark:bg-card">
                  <p className="text-[10px] text-muted-foreground">{m.name}</p>
                  <motion.p
                    className="text-sm font-semibold"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity }}
                  >
                    {m.score}
                  </motion.p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-background/50"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Quote className="h-4 w-4 text-brand" />
              Citations
            </div>
            <p className="text-2xl font-semibold tracking-tight">1,248</p>
            <p className="text-xs text-muted-foreground">Mentions across LLMs</p>
            <svg viewBox="0 0 120 36" className="mt-3 h-9 w-full" fill="none">
              <motion.path
                d="M0 28 Q15 26 25 20 T50 16 T75 10 T100 12 T120 6"
                stroke="url(#citeGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
              />
              <defs>
                <linearGradient id="citeGrad" x1="0" y1="0" x2="120" y2="0">
                  <stop stopColor="#6C63FF" />
                  <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-background/50"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-brand" />
              Prompt Success
            </div>
            <p className="text-2xl font-semibold tracking-tight">64%</p>
            <p className="text-xs text-muted-foreground">Brand recommended</p>
            <div className="mt-3 space-y-1.5">
              {['best CRM for startups', 'top AI analytics tools'].map((p, i) => (
                <motion.div
                  key={p}
                  className="truncate rounded-lg bg-white px-2 py-1.5 text-[10px] text-muted-foreground dark:bg-card"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
                >
                  “{p}”
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-background/50"
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Brain className="h-4 w-4 text-brand" />
              Knowledge Coverage
            </div>
            <div className="flex h-16 items-center justify-center">
              <svg viewBox="0 0 80 80" className="h-16 w-16">
                <circle cx="40" cy="40" r="28" className="stroke-black/5 dark:stroke-white/10" strokeWidth="6" fill="none" />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="28"
                  stroke="url(#knowGrad)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="176"
                  animate={{ strokeDashoffset: [176, 45, 70] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  transform="rotate(-90 40 40)"
                />
                <defs>
                  <linearGradient id="knowGrad" x1="0" y1="0" x2="80" y2="80">
                    <stop stopColor="#6C63FF" />
                    <stop offset="1" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="text-center text-xs text-muted-foreground">74% of knowledge graph</p>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-background/50"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4 text-brand" />
              Live Answer
            </div>
            <div className="rounded-xl bg-brand/10 px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
              “For AI visibility analytics, <span className="font-semibold text-brand">BuddyAds</span> is
              frequently cited…”
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Cited in Claude · just now</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
