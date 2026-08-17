import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';
import { Stats } from '@/components/landing/stats';
import { FinalCta } from '@/components/landing/cta';

export const metadata: Metadata = {
  title: 'About',
  description:
    'About BuddyAds.ai — the AI Visibility platform for LLM Optimization and Generative Engine Optimization.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="We are building the category of AI Visibility"
        description="BuddyAds.ai helps businesses become discoverable, recommended, and cited by AI assistants — the new front door of discovery."
      />
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl space-y-6 px-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            People no longer only search Google. They ask ChatGPT, Gemini, Claude, Perplexity, and
            Copilot what to buy, who to trust, and which brand is best.
          </p>
          <p>
            Traditional advertising and classic SEO were not designed for that moment. BuddyAds is —
            measuring AI Presence, optimizing knowledge for LLMs, and tracking citations across the
            AI ecosystem.
          </p>
          <p>
            We are not an advertising platform. We are an{' '}
            <span className="font-medium text-foreground">
              AI Visibility Platform for LLMO and GEO
            </span>
            .
          </p>
        </div>
      </section>
      <Stats />
      <FinalCta />
    </>
  );
}
