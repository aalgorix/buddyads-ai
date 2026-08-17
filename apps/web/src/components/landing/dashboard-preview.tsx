'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '@/components/landing/section';
import { Reveal } from '@/components/landing/reveal';
import { cn } from '@/lib/utils';

export function DashboardPreview() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  return (
    <Section
      id="dashboard"
      eyebrow="Dashboard Preview"
      title="Your command center for AI search"
      description="Visibility scores, citations, prompt success, and competitor gaps — built for LLMs, not ad managers."
    >
      <Reveal variant="scale">
        <div className="mb-6 flex justify-center gap-2">
          {(['light', 'dark'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                mode === m
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={mode === m}
            >
              {m} mode
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className={cn(
              'overflow-hidden rounded-3xl border premium-shadow-lg',
              mode === 'dark'
                ? 'border-white/10 bg-[#0B1220] text-white'
                : 'border-black/[0.08] bg-white text-foreground',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between border-b px-5 py-3.5',
                mode === 'dark' ? 'border-white/10' : 'border-black/[0.06]',
              )}
            >
              <div className="flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              </div>
              <p className={cn('text-xs font-medium', mode === 'dark' ? 'text-white/50' : 'text-muted-foreground')}>
                BuddyAds Visibility Dashboard
              </p>
              <span className="rounded-full bg-[#22C55E]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#22C55E]">
                9 LLMs synced
              </span>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-12 md:p-6">
              <div
                className={cn(
                  'rounded-2xl p-5 md:col-span-4',
                  mode === 'dark' ? 'bg-white/5' : 'bg-[#FAFAFA]',
                )}
              >
                <p className={cn('text-sm', mode === 'dark' ? 'text-white/50' : 'text-muted-foreground')}>
                  AI Visibility Score
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">82</p>
                <p className="mt-1 text-sm text-[#22C55E]">↑ 9 pts vs last month</p>
              </div>

              <div
                className={cn(
                  'rounded-2xl p-5 md:col-span-4',
                  mode === 'dark' ? 'bg-white/5' : 'bg-[#FAFAFA]',
                )}
              >
                <p className={cn('text-sm', mode === 'dark' ? 'text-white/50' : 'text-muted-foreground')}>
                  LLM Presence Score
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-3xl font-semibold">76</p>
                  <div className="mb-1 h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <motion.div
                      className="h-full rounded-full gradient-bg"
                      initial={{ width: 0 }}
                      whileInView={{ width: '76%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:col-span-4">
                {[
                  { label: 'Citations', value: '1.2K' },
                  { label: 'Prompt Success', value: '64%' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      'rounded-2xl p-5',
                      mode === 'dark' ? 'bg-white/5' : 'bg-[#FAFAFA]',
                    )}
                  >
                    <p className={cn('text-xs', mode === 'dark' ? 'text-white/50' : 'text-muted-foreground')}>
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div
                className={cn(
                  'rounded-2xl p-5 md:col-span-8',
                  mode === 'dark' ? 'bg-white/5' : 'bg-[#FAFAFA]',
                )}
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium">AI Visibility Trend</p>
                  <p className="text-xs text-[#22C55E]">Recommendation freq. +28%</p>
                </div>
                <div className="flex h-36 items-end gap-2">
                  {[35, 42, 48, 45, 58, 62, 70, 68, 75, 82, 78, 88].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-md"
                      style={{
                        background: 'linear-gradient(180deg, #6C63FF, #3B82F6)',
                        opacity: 0.35 + (i / 12) * 0.65,
                      }}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 md:col-span-4">
                <div
                  className={cn(
                    'rounded-2xl p-5',
                    mode === 'dark' ? 'bg-white/5' : 'bg-[#FAFAFA]',
                  )}
                >
                  <p className="text-sm font-medium">AI Recommendations</p>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      'Add structured FAQ for “best X” prompts',
                      'Strengthen entity clarity on pricing page',
                      'Close citation gap vs Competitor B',
                    ].map((s) => (
                      <li
                        key={s}
                        className={cn(
                          'rounded-xl px-3 py-2 text-xs leading-relaxed',
                          mode === 'dark' ? 'bg-white/5 text-white/80' : 'bg-white text-muted-foreground',
                        )}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 md:col-span-12">
                {[
                  { name: 'ChatGPT', status: 'Strong', score: '86', metric: 'Presence' },
                  { name: 'Gemini', status: 'Growing', score: '74', metric: 'Presence' },
                  { name: 'Claude', status: 'Strong', score: '81', metric: 'Presence' },
                ].map((c) => (
                  <div
                    key={c.name}
                    className={cn(
                      'rounded-2xl border p-4 transition-transform hover:-translate-y-0.5',
                      mode === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/[0.06] bg-white',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-medium text-[#22C55E]">
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between text-xs">
                      <span className={mode === 'dark' ? 'text-white/50' : 'text-muted-foreground'}>
                        {c.metric}
                      </span>
                      <span className="font-medium">{c.score}/100</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-4 md:col-span-12">
                {[
                  { label: 'Knowledge Coverage', value: '74%' },
                  { label: 'Brand Sentiment', value: 'Positive' },
                  { label: 'AI Index Health', value: 'Good' },
                  { label: 'Content Status', value: '12 open' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      'rounded-2xl p-4',
                      mode === 'dark' ? 'bg-white/5' : 'bg-[#FAFAFA]',
                    )}
                  >
                    <p className={cn('text-xs', mode === 'dark' ? 'text-white/50' : 'text-muted-foreground')}>
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </Reveal>
    </Section>
  );
}
