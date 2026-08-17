import type { Metadata } from 'next';
import { SimplePage } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Security',
  description: 'BuddyAds.ai security practices.',
  alternates: { canonical: '/security' },
};

export default function SecurityPage() {
  return (
    <SimplePage
      title="Security"
      description="Encryption, access control, and responsible disclosure."
    >
      <div className="space-y-4 text-muted-foreground">
        <p>
          Data is encrypted in transit (TLS) and at rest. Role-based access and SSO are available
          on Enterprise. We continuously monitor for anomalies.
        </p>
        <p>
          Report vulnerabilities to rohit@buddyads.agency. We take responsible disclosure seriously.
        </p>
      </div>
    </SimplePage>
  );
}
