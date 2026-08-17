import type { Metadata } from 'next';
import { SimplePage } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'BuddyAds.ai privacy policy.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <SimplePage
      title="Privacy Policy"
      description="How BuddyAds.ai collects, uses, and protects your information."
    >
      <div className="prose prose-neutral dark:prose-invert space-y-4 text-muted-foreground">
        <p>
          We collect account and usage data to provide and improve BuddyAds.ai. We do not sell
          your personal data. Campaign assets remain in your workspace and are not used to train
          public models.
        </p>
        <p>
          For privacy requests, contact rohit@buddyads.agency. This page is a product summary —
          formal legal terms are provided during enterprise onboarding.
        </p>
      </div>
    </SimplePage>
  );
}
