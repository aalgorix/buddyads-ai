'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Section } from '@/components/landing/section';
import { Stagger, StaggerItem } from '@/components/landing/reveal';
import { signUpUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Starter',
    price: '$79',
    period: '/mo',
    description: 'For brands starting LLM Optimization.',
    features: [
      'AI Visibility Score',
      '3 AI models monitored',
      'Weekly brand scans',
      'Basic citation insights',
      'Email support',
    ],
    cta: 'Check My AI Visibility',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$249',
    period: '/mo',
    description: 'For teams competing in AI search.',
    features: [
      'Everything in Starter',
      'All major LLMs',
      'Prompt performance tests',
      'Competitor AI analysis',
      'Knowledge recommendations',
      'Priority support',
    ],
    cta: 'Check My AI Visibility',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For multi-brand and global visibility programs.',
    features: [
      'Everything in Growth',
      'Custom model coverage',
      'SSO & advanced roles',
      'API access',
      'Dedicated success partner',
      'SLA & security review',
    ],
    cta: 'Book a Demo',
    highlighted: false,
  },
];

export function Pricing({ headed = true }: { headed?: boolean } = {}) {
  return (
    <Section
      id="pricing"
      className="bg-[#FAFAFA] dark:bg-card/40"
      eyebrow={headed ? 'Pricing' : undefined}
      title={headed ? 'Invest in being recommended' : undefined}
      description={headed ? 'Plans for LLMO and GEO — not ad spend.' : undefined}
    >
      <Stagger className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <StaggerItem key={plan.name}>
            <article
              className={cn(
                'relative flex h-full flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1',
                plan.highlighted
                  ? 'border-brand/40 bg-foreground text-background ring-1 ring-brand/30 premium-shadow-lg'
                  : 'border-black/[0.08] bg-white dark:border-white/10 dark:bg-card',
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-bg px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <div>
                <h3 className={cn('text-lg font-semibold', plan.highlighted && 'text-white')}>
                  {plan.name}
                </h3>
                <p
                  className={cn(
                    'mt-1 text-sm',
                    plan.highlighted ? 'text-white/70' : 'text-muted-foreground',
                  )}
                >
                  {plan.description}
                </p>
                <p className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className={plan.highlighted ? 'text-white/60' : 'text-muted-foreground'}>
                      {plan.period}
                    </span>
                  )}
                </p>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        plan.highlighted ? 'text-[#5B7FFF]' : 'text-brand',
                      )}
                      aria-hidden
                    />
                    <span className={plan.highlighted ? 'text-white/85' : 'text-muted-foreground'}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === 'Enterprise' ? '/contact' : signUpUrl}
                className={cn(
                  'mt-8 inline-flex h-12 items-center justify-center rounded-full text-sm font-medium transition-all hover:scale-[1.02]',
                  plan.highlighted
                    ? 'bg-white text-foreground hover:opacity-95'
                    : 'bg-foreground text-background hover:opacity-90',
                )}
              >
                {plan.cta}
              </Link>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
