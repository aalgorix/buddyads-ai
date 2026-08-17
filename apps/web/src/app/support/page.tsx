import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with BuddyAds.ai AI Visibility and LLM Optimization.',
  alternates: { canonical: '/support' },
};

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="We are here when you need us"
        description="Reach the BuddyAds.ai team at rohit@buddyads.agency. Enterprise customers get dedicated channels for AI Visibility programs."
      />
      <div className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <Link
          href="/contact"
          className="inline-flex h-12 items-center rounded-full bg-foreground px-8 text-sm font-medium text-background hover:opacity-90"
        >
          Contact Support
        </Link>
      </div>
    </>
  );
}
