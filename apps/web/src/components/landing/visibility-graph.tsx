'use client';

import { motion } from 'framer-motion';

const rings = [
  { label: 'ChatGPT', value: 72, color: '#10b981' },
  { label: 'Gemini', value: 58, color: '#3b82f6' },
  { label: 'Claude', value: 64, color: '#f59e0b' },
  { label: 'Perplexity', value: 49, color: '#8b5cf6' },
  { label: 'Your brand', value: 41, color: '#2563eb' },
];

/** Premium light share-of-voice visual: area chart + progress bars. */
export function VisibilityShowcase() {
  return (
    <section className="section-soft border-y border-line px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-site">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Visibility pulse</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Watch your AI footprint come into focus
          </h2>
          <p className="mt-3 text-base text-muted md:text-lg">
            Clean share-of-voice signals and model coverage — the same language your report uses to
            prioritize what to fix first.
          </p>
        </motion.div>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Smooth multi-layer area chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="glass relative overflow-hidden rounded-3xl p-6 md:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Recommendation coverage</p>
                <p className="text-xs text-muted">Sample 8-week trend across assistants</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                +23 pts vs start
              </span>
            </div>

            <div className="relative mt-6 h-56 w-full md:h-64">
              <svg viewBox="0 0 640 240" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="areaCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="strokeMain" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                {[40, 80, 120, 160, 200].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="640"
                    y2={y}
                    stroke="rgba(17,24,39,0.06)"
                    strokeWidth="1"
                  />
                ))}
                <path
                  d="M0,190 C60,175 100,160 160,155 C220,150 240,120 300,110 C360,100 390,95 450,80 C510,65 560,70 640,45 L640,240 L0,240 Z"
                  fill="url(#areaCyan)"
                />
                <path
                  d="M0,210 C70,200 110,185 170,175 C230,165 260,150 320,135 C380,120 420,115 480,95 C540,75 590,70 640,55 L640,240 L0,240 Z"
                  fill="url(#areaBlue)"
                />
                <path
                  className="chart-path"
                  d="M0,190 C60,175 100,160 160,155 C220,150 240,120 300,110 C360,100 390,95 450,80 C510,65 560,70 640,45"
                  fill="none"
                  stroke="url(#strokeMain)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  className="chart-path"
                  d="M0,210 C70,200 110,185 170,175 C230,165 260,150 320,135 C380,120 420,115 480,95 C540,75 590,70 640,55"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeOpacity="0.7"
                  strokeLinecap="round"
                  style={{ animationDelay: '0.35s' }}
                />
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-5 rounded-full bg-gradient-to-r from-accent to-cyan" /> Your brand
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-5 rounded-full bg-cyan/70" /> Category average
              </span>
            </div>
          </motion.div>

          {/* Model rings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="glass flex flex-col justify-between rounded-3xl p-6 md:p-8"
          >
            <div>
              <p className="text-sm font-semibold text-ink">Model coverage</p>
              <p className="mt-1 text-xs text-muted">Where answers already include you</p>
            </div>
            <ul className="mt-8 space-y-5">
              {rings.map((r, i) => (
                <li key={r.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{r.label}</span>
                    <span className="font-semibold tabular-nums text-ink">{r.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${r.color}, ${r.color}cc)`,
                      }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${r.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
