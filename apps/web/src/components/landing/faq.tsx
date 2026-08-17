'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Section } from '@/components/landing/section';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'What is BuddyAds.ai?',
    a: 'BuddyAds.ai is an AI Visibility & LLM Optimization platform. We help businesses become discoverable, recommended, and cited by AI assistants like ChatGPT, Gemini, Claude, Perplexity, and more.',
  },
  {
    q: 'Is this advertising or SEO?',
    a: 'Neither in the traditional sense. We focus on LLMO (LLM Optimization) and GEO (Generative Engine Optimization) — improving how AI models understand and recommend your brand. We do not run Google Ads, Meta Ads, or PPC campaigns.',
  },
  {
    q: 'Which AI models do you monitor?',
    a: 'ChatGPT, Gemini, Claude, Perplexity, Microsoft Copilot, Grok, DeepSeek, Mistral, Meta AI — with coverage expanding as new assistants emerge.',
  },
  {
    q: 'What is an AI Presence Score?',
    a: 'A single metric that summarizes how visible your brand is across major AI assistants — combining mentions, citations, recommendation rate, and knowledge coverage.',
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

export function Faq({ headed = true }: { headed?: boolean } = {}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section
      id="faq"
      eyebrow={headed ? 'FAQ' : undefined}
      title={headed ? 'Clear answers about AI visibility' : undefined}
      description={headed ? 'What we are — and what we are not.' : undefined}
    >
      <div className="mx-auto max-w-2xl divide-y divide-black/[0.06] rounded-3xl border border-black/[0.08] bg-white dark:divide-white/10 dark:border-white/10 dark:bg-card">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <h3>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-medium transition-colors hover:text-brand"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  {item.q}
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300',
                      isOpen && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-[15px] leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
