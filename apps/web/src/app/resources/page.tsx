import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/page-hero';
import { FinalCta } from '@/components/landing/cta';
import { docsUrl } from '@/lib/urls';
import { BookOpen, FileText, HelpCircle, Newspaper } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Guides on LLMO, GEO, and AI Search Visibility from BuddyAds.ai.',
  alternates: { canonical: '/resources' },
};

const resources = [
  {
    href: '/docs',
    icon: BookOpen,
    title: 'Documentation',
    description: 'Product guides for AI Visibility Score, prompts, and monitoring.',
  },
  {
    href: docsUrl,
    icon: FileText,
    title: 'Developer Portal',
    description: 'APIs for integrating multi-LLM visibility into your stack.',
  },
  {
    href: '/support',
    icon: HelpCircle,
    title: 'Support Center',
    description: 'Get help from the BuddyAds team when you need it.',
  },
  {
    href: '/blog',
    icon: Newspaper,
    title: 'Blog',
    description: 'Playbooks on LLMO, GEO, and winning AI recommendations.',
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Learn AI Visibility"
        description="Everything you need to master LLM Optimization with BuddyAds."
      />
      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-2">
          {resources.map((r) => (
            <Link
              key={r.title}
              href={r.href}
              className="group rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-7 transition-all hover:-translate-y-1 hover:border-brand/30 dark:border-white/10 dark:bg-card"
            >
              <r.icon className="mb-4 h-6 w-6 text-brand" aria-hidden />
              <h2 className="text-lg font-semibold group-hover:text-brand">{r.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <FinalCta />
    </>
  );
}
