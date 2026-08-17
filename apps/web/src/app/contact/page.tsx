import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact-form';
import { PageHero } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Book a BuddyAds.ai demo for AI Visibility and LLM Optimization.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Book a demo or say hello"
        description="Tell us about your AI Visibility goals. We will show how BuddyAds monitors and improves how LLMs recommend your brand."
      />
      <ContactForm />
    </>
  );
}
