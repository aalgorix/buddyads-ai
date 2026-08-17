import type { Metadata } from 'next';
import { Pricing } from '@/components/landing/pricing';
import { Faq } from '@/components/landing/faq';
import { FinalCta } from '@/components/landing/cta';
import { PageHero } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'BuddyAds.ai pricing for AI Visibility, LLM monitoring, and Generative Engine Optimization.',
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Plans for AI Visibility"
        description="Invest in being recommended by AI — not in traditional ad inventory."
      />
      <Pricing headed={false} />
      <Faq headed={false} />
      <FinalCta />
    </>
  );
}
