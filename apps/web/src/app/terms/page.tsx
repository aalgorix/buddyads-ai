import type { Metadata } from 'next';
import { SimplePage } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'BuddyAds.ai terms of service.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <SimplePage
      title="Terms of Service"
      description="The agreement between you and BuddyAds.ai when using the platform."
    >
      <div className="space-y-4 text-muted-foreground">
        <p>
          By using BuddyAds.ai you agree to use the product lawfully, respect the policies of AI
          platforms you monitor against, and keep your account credentials secure.
        </p>
        <p>
          Paid plans renew monthly unless cancelled. Enterprise agreements may supersede these
          summary terms. Contact rohit@buddyads.agency with questions.
        </p>
      </div>
    </SimplePage>
  );
}
