import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/page-hero';
import { docsUrl } from '@/lib/urls';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'BuddyAds.ai documentation for AI Visibility, LLMO, and multi-LLM monitoring.',
  alternates: { canonical: '/docs' },
};

export default function DocsPage() {
  return (
    <>
      <PageHero
        eyebrow="Docs"
        title="Documentation"
        description="Guides for AI Presence Score, prompt testing, citation insights, and API access."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-6 pb-24">
        <ul className="space-y-4">
          <li>
            <a
              href={docsUrl}
              className="group flex items-center justify-between rounded-2xl border border-black/[0.08] bg-[#FAFAFA] px-5 py-4 transition hover:border-brand/30 dark:border-white/10 dark:bg-card"
            >
              <span>
                <span className="block font-medium group-hover:text-brand">Developer Portal</span>
                <span className="text-sm text-muted-foreground">APIs for multi-LLM visibility</span>
              </span>
              <span aria-hidden>→</span>
            </a>
          </li>
          <li>
            <a
              href="http://localhost:8000/docs"
              className="group flex items-center justify-between rounded-2xl border border-black/[0.08] bg-[#FAFAFA] px-5 py-4 transition hover:border-brand/30 dark:border-white/10 dark:bg-card"
            >
              <span>
                <span className="block font-medium group-hover:text-brand">OpenAPI / Swagger</span>
                <span className="text-sm text-muted-foreground">Interactive API explorer</span>
              </span>
              <span aria-hidden>→</span>
            </a>
          </li>
          <li>
            <Link
              href="/resources"
              className="group flex items-center justify-between rounded-2xl border border-black/[0.08] bg-[#FAFAFA] px-5 py-4 transition hover:border-brand/30 dark:border-white/10 dark:bg-card"
            >
              <span>
                <span className="block font-medium group-hover:text-brand">Resource Hub</span>
                <span className="text-sm text-muted-foreground">LLMO guides, blog, and support</span>
              </span>
              <span aria-hidden>→</span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
