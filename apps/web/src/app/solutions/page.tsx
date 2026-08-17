import type { Metadata } from 'next';
import { Industries } from '@/components/landing/industries';
import { Comparison } from '@/components/landing/comparison';
import { FinalCta } from '@/components/landing/cta';
import { PageHero } from '@/components/page-hero';
import { Stagger, StaggerItem } from '@/components/landing/reveal';

export const metadata: Metadata = {
  title: 'Solutions',
  description:
    'BuddyAds.ai solutions for brands, growth teams, and enterprises competing in AI search and LLM recommendations.',
  alternates: { canonical: '/solutions' },
};

const solutions = [
  {
    title: 'For Growth Teams',
    description:
      'Know which prompts recommend you, which do not, and what to fix — across every major LLM.',
  },
  {
    title: 'For Brand & Comms',
    description:
      'Monitor how AI talks about your brand: accuracy, sentiment, and citation quality.',
  },
  {
    title: 'For SEO Leaders',
    description:
      'Extend SEO into GEO and LLMO. Win the answer layer, not only the SERP.',
  },
  {
    title: 'For Enterprise',
    description:
      'Multi-brand monitoring, competitor intelligence, SSO, and dedicated AI visibility programs.',
  },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Win where buyers ask AI"
        description="Whether you lead SEO, brand, or growth — BuddyAds makes your company visible in conversational search."
      />
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Stagger className="grid gap-4 md:grid-cols-2">
            {solutions.map((s) => (
              <StaggerItem key={s.title}>
                <article className="h-full rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-8 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-card">
                  <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
                  <p className="mt-2 text-muted-foreground">{s.description}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
      <Industries headed={false} />
      <Comparison headed={false} />
      <FinalCta />
    </>
  );
}
