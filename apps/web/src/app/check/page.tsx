import type { Metadata } from 'next';
import { AiConsultant } from '@/components/consultant/ai-consultant';

export const metadata: Metadata = {
  title: 'AI Visibility Consultant',
  description:
    'Chat with Buddy, your AI strategy consultant. Answer a few questions and we will queue your AI Visibility Analysis.',
  alternates: { canonical: '/check' },
};

export default function CheckPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hero-glow opacity-80" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-40 dark:opacity-20" aria-hidden />
      <div className="relative border-b border-black/[0.06] dark:border-white/10">
        <div className="mx-auto max-w-3xl px-6 pb-8 pt-12 text-center md:pt-16">
          <p className="mb-3 text-sm font-medium text-brand">AI Strategy Consultation</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Meet Buddy, your AI Consultant
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
            A conversational intake — one question at a time. No long forms. When we finish, we start
            your AI Visibility Analysis.
          </p>
        </div>
      </div>
      <AiConsultant />
    </div>
  );
}
