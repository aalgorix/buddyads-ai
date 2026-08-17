'use client';

import {
  Binary,
  BookOpen,
  Eye,
  FileSearch,
  Gauge,
  Lightbulb,
  MessageSquareText,
  Radar,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Section } from '@/components/landing/section';
import { Reveal, Stagger, StaggerItem } from '@/components/landing/reveal';

const capabilities = [
  {
    icon: Eye,
    title: 'AI Visibility Analysis',
    description: 'See whether your business appears in AI-generated answers — and why it does not.',
  },
  {
    icon: Radar,
    title: 'LLM Brand Monitoring',
    description: 'Track where and how ChatGPT, Gemini, Claude, and others mention your brand.',
  },
  {
    icon: FileSearch,
    title: 'AI Citation Optimization',
    description: 'Improve the likelihood that LLMs reference your company as a trusted source.',
  },
  {
    icon: MessageSquareText,
    title: 'Prompt Performance',
    description: 'Test prompts across multiple AI platforms and compare recommendation rates.',
  },
  {
    icon: Gauge,
    title: 'AI Search Ranking',
    description: 'Measure visibility in ChatGPT, Gemini, Claude, Perplexity, and more.',
  },
  {
    icon: Binary,
    title: 'Knowledge Optimization',
    description: 'Structure content so AI models accurately understand your products and category.',
  },
  {
    icon: Sparkles,
    title: 'AI Presence Score',
    description: 'One score for how visible your brand is across major AI assistants.',
  },
  {
    icon: Scale,
    title: 'Competitor AI Analysis',
    description: 'Compare how rivals appear in AI answers — and where you can overtake them.',
  },
  {
    icon: Lightbulb,
    title: 'AI Content Recommendations',
    description: 'Get precise fixes that increase discoverability inside LLM responses.',
  },
  {
    icon: BookOpen,
    title: 'Multi-LLM Monitoring',
    description: 'Watch your brand across every major AI ecosystem from a single dashboard.',
  },
];

export function Capabilities({ headed = true }: { headed?: boolean } = {}) {
  return (
    <Section
      id="capabilities"
      eyebrow={headed ? 'Core Capabilities' : undefined}
      title={headed ? 'Everything you need to win AI search' : undefined}
      description={
        headed
          ? 'LLM Optimization (LLMO) and Generative Engine Optimization (GEO) — purpose-built for conversational AI.'
          : undefined
      }
    >
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((item) => (
          <StaggerItem key={item.title}>
            <Reveal variant="none">
              <article className="group h-full rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_20px_40px_rgba(91,127,255,0.1)] dark:border-white/10 dark:bg-card dark:hover:border-brand/40">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            </Reveal>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
