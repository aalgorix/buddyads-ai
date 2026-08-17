import type { Metadata } from 'next';
import { SimplePage, TextLink } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Insights on LLMO, GEO, and AI Search Visibility from BuddyAds.ai.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  return (
    <SimplePage
      title="Blog"
      description="Playbooks on AI Visibility, citation optimization, and winning LLM recommendations."
    >
      <p className="text-muted-foreground">
        New essays ship soon. Meanwhile, explore the{' '}
        <TextLink href="/resources">Resource Hub</TextLink> or{' '}
        <TextLink href="/docs">Documentation</TextLink>.
      </p>
    </SimplePage>
  );
}
