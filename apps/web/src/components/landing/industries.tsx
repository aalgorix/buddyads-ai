'use client';

import {
  Building2,
  Car,
  GraduationCap,
  HeartPulse,
  Plane,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { Section } from '@/components/landing/section';
import { Stagger, StaggerItem } from '@/components/landing/reveal';

const industries = [
  { icon: ShoppingBag, title: 'Ecommerce', blurb: 'Become the product AI suggests when shoppers ask.' },
  { icon: HeartPulse, title: 'Healthcare', blurb: 'Earn accurate, trusted mentions in sensitive queries.' },
  { icon: GraduationCap, title: 'Education', blurb: 'Surface in AI answers about courses and careers.' },
  { icon: Wallet, title: 'Finance', blurb: 'Win recommendation slots for fintech and banking prompts.' },
  { icon: Plane, title: 'Travel', blurb: 'Show up when AI plans trips and compares options.' },
  { icon: UtensilsCrossed, title: 'Restaurants', blurb: 'Get cited for local and cuisine recommendations.' },
  { icon: Building2, title: 'Real Estate', blurb: 'Appear in AI guidance for buyers and investors.' },
  { icon: Car, title: 'Automobile', blurb: 'Be the brand AI names for models and comparisons.' },
];

export function Industries({ headed = true }: { headed?: boolean } = {}) {
  return (
    <Section
      id="industries"
      className="bg-[#FAFAFA] dark:bg-card/40"
      eyebrow={headed ? 'Industries' : undefined}
      title={headed ? 'Built for brands that need to be found by AI' : undefined}
      description={
        headed ? 'Whatever your category, AI assistants are already answering for your buyers.' : undefined
      }
    >
      <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {industries.map((item) => (
          <StaggerItem key={item.title}>
            <article className="group flex h-full flex-col rounded-2xl border border-black/[0.06] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/25 dark:border-white/10 dark:bg-card md:p-6">
              <item.icon className="mb-3 h-6 w-6 text-brand transition-transform group-hover:scale-110" aria-hidden />
              <h3 className="font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.blurb}</p>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
