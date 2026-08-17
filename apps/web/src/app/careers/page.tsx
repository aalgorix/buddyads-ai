import type { Metadata } from 'next';
import { SimplePage, TextLink } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join BuddyAds.ai and build the future of AI Visibility and LLM Optimization.',
  alternates: { canonical: '/careers' },
};

export default function CareersPage() {
  return (
    <SimplePage
      title="Careers"
      description="We are hiring builders obsessed with AI search, knowledge graphs, and delightful product craft."
    >
      <p className="text-muted-foreground">
        Open roles will appear here. Reach out at rohit@buddyads.agency or{' '}
        <TextLink href="/contact">get in touch</TextLink>.
      </p>
    </SimplePage>
  );
}
