'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Section } from '@/components/landing/section';
import { Stagger, StaggerItem } from '@/components/landing/reveal';

const rows = [
  { label: 'Visibility target', old: 'Google & web SERPs', buddy: 'ChatGPT, Claude, Gemini & more' },
  { label: 'What you optimize', old: 'Keywords & backlinks', buddy: 'Citations, entities & prompts' },
  { label: 'Measurement', old: 'Rankings & traffic', buddy: 'AI Presence & recommendation rate' },
  { label: 'Competitor insight', old: 'Keyword gap reports', buddy: 'Who AI recommends — and why' },
  { label: 'Content strategy', old: 'Blog volume SEO', buddy: 'Knowledge LLMs can cite' },
  { label: 'Model coverage', old: 'Not applicable', buddy: 'Multi-LLM monitoring' },
  { label: 'Answer inclusion', old: 'Featured snippets only', buddy: 'Conversational recommendations' },
  { label: 'Future-proofing', old: 'Search as it was', buddy: 'Search as AI is becoming' },
];

export function Comparison({ headed = true }: { headed?: boolean } = {}) {
  return (
    <Section
      id="why"
      className="bg-[#FAFAFA] dark:bg-card/40"
      eyebrow={headed ? 'Why BuddyAds' : undefined}
      title={headed ? 'Traditional SEO vs AI Visibility' : undefined}
      description={
        headed
          ? 'SEO got you on Google. LLMO gets you recommended by AI assistants.'
          : undefined
      }
    >
      <Stagger className="overflow-hidden rounded-3xl border border-black/[0.08] bg-white premium-shadow dark:border-white/10 dark:bg-card">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-black/[0.06] dark:border-white/10">
          <div className="p-4 text-sm font-medium text-muted-foreground md:p-5" />
          <div className="border-l border-black/[0.06] p-4 text-center text-sm font-semibold text-muted-foreground dark:border-white/10 md:p-5">
            Traditional SEO
          </div>
          <div className="border-l border-black/[0.06] bg-brand/[0.04] p-4 text-center text-sm font-semibold text-brand dark:border-white/10 md:p-5">
            BuddyAds AI Visibility
          </div>
        </div>

        {rows.map((row) => (
          <StaggerItem key={row.label}>
            <motion.div
              className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-black/[0.04] last:border-0 dark:border-white/5"
              whileHover={{ backgroundColor: 'rgba(91,127,255,0.03)' }}
            >
              <div className="flex items-center p-3.5 text-sm font-medium md:p-4">{row.label}</div>
              <div className="flex items-center justify-center gap-2 border-l border-black/[0.04] p-3.5 text-center text-sm text-muted-foreground dark:border-white/5 md:p-4">
                <X className="hidden h-3.5 w-3.5 shrink-0 text-red-400 sm:block" aria-hidden />
                {row.old}
              </div>
              <div className="flex items-center justify-center gap-2 border-l border-black/[0.04] bg-brand/[0.03] p-3.5 text-center text-sm font-medium dark:border-white/5 md:p-4">
                <Check className="hidden h-3.5 w-3.5 shrink-0 text-success sm:block" aria-hidden />
                {row.buddy}
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
