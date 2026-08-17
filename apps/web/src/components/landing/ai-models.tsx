'use client';

import { Section } from '@/components/landing/section';
import { Stagger, StaggerItem } from '@/components/landing/reveal';

const models = [
  {
    name: 'ChatGPT',
    maker: 'OpenAI',
    description: 'Monitor brand mentions, recommendations, and citation patterns in GPT responses.',
    accent: '#10A37F',
  },
  {
    name: 'Gemini',
    maker: 'Google',
    description: 'Track how Google’s AI surfaces your brand across prompts and follow-ups.',
    accent: '#4285F4',
  },
  {
    name: 'Claude',
    maker: 'Anthropic',
    description: 'Measure presence in Claude answers where precision and trust matter most.',
    accent: '#D97706',
  },
  {
    name: 'Perplexity',
    maker: 'Perplexity',
    description: 'See if you are cited as a source in AI search with live web grounding.',
    accent: '#1F1F1F',
  },
  {
    name: 'Microsoft Copilot',
    maker: 'Microsoft',
    description: 'Understand visibility inside Copilot experiences across work and web.',
    accent: '#0078D4',
  },
  {
    name: 'Grok',
    maker: 'xAI',
    description: 'Follow how Grok talks about your category and competitors in real time.',
    accent: '#000000',
  },
  {
    name: 'DeepSeek',
    maker: 'DeepSeek',
    description: 'Expand monitoring into emerging models shaping global AI search.',
    accent: '#4F46E5',
  },
  {
    name: 'Mistral',
    maker: 'Mistral AI',
    description: 'Cover European and open-weight ecosystems that influence discovery.',
    accent: '#FF7000',
  },
  {
    name: 'Meta AI',
    maker: 'Meta',
    description: 'Track brand presence across Meta’s AI assistants and surfaces.',
    accent: '#0668E1',
  },
];

export function AiModels({ headed = true }: { headed?: boolean } = {}) {
  return (
    <Section
      id="models"
      eyebrow={headed ? 'Supported AI Ecosystems' : undefined}
      title={headed ? 'Optimize for the assistants people ask' : undefined}
      description={
        headed
          ? 'These are analysis targets — the LLMs that recommend, cite, and shape brand discovery.'
          : undefined
      }
    >
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <StaggerItem key={model.name}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-card">
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-35"
                style={{ background: model.accent }}
                aria-hidden
              />
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: model.accent }}
                  aria-hidden
                >
                  {model.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">{model.name}</h3>
                  <p className="text-xs text-muted-foreground">{model.maker}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{model.description}</p>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
