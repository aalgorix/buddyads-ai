'use client';

import { motion } from 'framer-motion';
import { ArrowDown, Eye, LineChart, Radar, Sparkles, Wrench } from 'lucide-react';
import { Section } from '@/components/landing/section';
import { Stagger, StaggerItem } from '@/components/landing/reveal';
import { viewportOnce } from '@/lib/motion';

const steps = [
  {
    icon: Eye,
    title: 'Discover',
    description: 'Scan how AI assistants talk about your brand, category, and competitors.',
  },
  {
    icon: Radar,
    title: 'Measure',
    description: 'Get your AI Presence Score, citation count, and model-by-model rankings.',
  },
  {
    icon: Wrench,
    title: 'Optimize',
    description: 'Apply knowledge and content recommendations that LLMs can understand.',
  },
  {
    icon: Sparkles,
    title: 'Improve Citations',
    description: 'Increase the rate at which AI recommends and references your brand.',
  },
  {
    icon: LineChart,
    title: 'Monitor Continuously',
    description: 'Track visibility trends as models update — stay the brand AI trusts.',
  },
];

export function Workflow() {
  return (
    <Section
      id="workflow"
      className="bg-[#FAFAFA] dark:bg-card/40"
      eyebrow="How It Works"
      title="From invisible to recommended"
      description="A continuous loop for LLM Optimization — not a one-time audit."
    >
      <Stagger className="relative mx-auto max-w-2xl">
        {steps.map((step, index) => (
          <StaggerItem key={step.title}>
            <div className="relative flex gap-5 pb-2">
              <div className="flex flex-col items-center">
                <motion.div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-white shadow-sm dark:border-white/10 dark:bg-background"
                  whileInView={{ scale: [0.9, 1.05, 1] }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <step.icon className="h-6 w-6 text-brand" aria-hidden />
                </motion.div>
                {index < steps.length - 1 && (
                  <div className="my-2 flex flex-col items-center gap-1">
                    <motion.div
                      className="h-10 w-px bg-gradient-to-b from-brand/50 to-brand/10"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={viewportOnce}
                      transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                      style={{ originY: 0 }}
                    />
                    <ArrowDown className="h-4 w-4 text-brand/60" aria-hidden />
                  </div>
                )}
              </div>
              <div className="pb-8 pt-2">
                <p className="text-xs font-medium uppercase tracking-wider text-brand">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-1.5 text-[15px] text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
