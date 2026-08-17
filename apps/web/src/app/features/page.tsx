import type { Metadata } from 'next';
import { Capabilities } from '@/components/landing/capabilities';
import { AiModels } from '@/components/landing/ai-models';
import { FinalCta } from '@/components/landing/cta';
import { PageHero } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'AI Visibility Analysis, LLM Brand Monitoring, Citation Optimization, Prompt Performance, and Multi-LLM Monitoring from BuddyAds.ai.',
  alternates: { canonical: '/features' },
};

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="LLM Optimization, end to end"
        description="Everything you need to measure and grow how AI assistants discover, cite, and recommend your brand."
      />
      <Capabilities headed={false} />
      <AiModels headed={false} />
      <FinalCta />
    </>
  );
}
