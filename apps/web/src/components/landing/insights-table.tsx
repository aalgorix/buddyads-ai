'use client';

import { motion } from 'framer-motion';

const rows = [
  {
    prompt: 'Best CRM for mid-market teams',
    chatgpt: 'Mentioned',
    gemini: 'Competitor',
    claude: 'Not listed',
    sentiment: 'Neutral',
    share: '12%',
  },
  {
    prompt: 'Tools like Salesforce for startups',
    chatgpt: 'Cited',
    gemini: 'Mentioned',
    claude: 'Cited',
    sentiment: 'Positive',
    share: '28%',
  },
  {
    prompt: 'Enterprise knowledge base software',
    chatgpt: 'Not listed',
    gemini: 'Not listed',
    claude: 'Competitor',
    sentiment: 'Gap',
    share: '0%',
  },
  {
    prompt: 'AI customer support platforms',
    chatgpt: 'Mentioned',
    gemini: 'Cited',
    claude: 'Mentioned',
    sentiment: 'Positive',
    share: '21%',
  },
  {
    prompt: 'Who is best for B2B payment infra',
    chatgpt: 'Competitor',
    gemini: 'Competitor',
    claude: 'Not listed',
    sentiment: 'Risk',
    share: '4%',
  },
  {
    prompt: 'Top marketing automation in APAC',
    chatgpt: 'Cited',
    gemini: 'Mentioned',
    claude: 'Mentioned',
    sentiment: 'Positive',
    share: '19%',
  },
];

function badgeClass(value: string) {
  if (value === 'Mentioned') return 'bg-sky-50 text-sky-700';
  if (value === 'Cited' || value === 'Positive') return 'bg-emerald-50 text-emerald-700';
  if (value === 'Competitor' || value === 'Risk') return 'bg-amber-50 text-amber-800';
  if (value === 'Gap') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-50 text-muted';
}

export function InsightsTable() {
  return (
    <section id="insights" className="px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-site">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Insights</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              All your AI search data in one table
            </h2>
            <p className="mt-3 text-base text-muted md:text-lg">
              Prompt-level visibility, model coverage, sentiment, and share of voice — the same
              structure teams use to prioritize fixes.
            </p>
          </div>
          <a
            href="/check-report"
            className="btn-gradient inline-flex h-11 shrink-0 items-center self-start rounded-full px-5 text-sm font-semibold md:self-auto"
          >
            Run your report
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="glass mt-10 overflow-hidden rounded-3xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-gradient-to-r from-accent/[0.06] to-cyan/[0.06] text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-4 font-semibold">Prompt / query</th>
                  <th className="px-4 py-4 font-semibold">ChatGPT</th>
                  <th className="px-4 py-4 font-semibold">Gemini</th>
                  <th className="px-4 py-4 font-semibold">Claude</th>
                  <th className="px-4 py-4 font-semibold">Sentiment</th>
                  <th className="px-5 py-4 font-semibold">Share of voice</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.prompt}
                    className="border-b border-line last:border-0 transition hover:bg-soft/60"
                  >
                    <td className="px-5 py-4 font-medium text-ink">{row.prompt}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${badgeClass(row.chatgpt)}`}>
                        {row.chatgpt}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${badgeClass(row.gemini)}`}>
                        {row.gemini}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${badgeClass(row.claude)}`}>
                        {row.claude}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${badgeClass(row.sentiment)}`}>
                        {row.sentiment}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-ink">{row.share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-soft/50 px-5 py-4 text-xs text-muted">
            <p>Example insight rows · your live report uses your domain + multi-LLM research.</p>
            <p className="font-medium text-ink">6 high-intent prompts shown</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
