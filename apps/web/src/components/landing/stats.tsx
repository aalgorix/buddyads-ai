'use client';

import { Section } from '@/components/landing/section';
import { Stagger, StaggerItem } from '@/components/landing/reveal';
import { AnimatedCounter } from '@/components/landing/animated-counter';

const stats = [
  { value: 9, suffix: '+', label: 'AI Models Monitored' },
  { value: 2, suffix: 'M+', label: 'Prompts Analyzed' },
  { value: 48, suffix: '%', label: 'Avg. Visibility Lift' },
  { value: 120, suffix: '+', label: 'Brands Optimized' },
];

export function Stats() {
  return (
    <Section id="stats" className="py-20 md:py-24" containerClassName="max-w-5xl">
      <Stagger className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <div className="text-center">
              <p className="text-4xl font-semibold tracking-tight md:text-5xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
