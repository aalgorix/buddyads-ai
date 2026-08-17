'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Section } from '@/components/landing/section';

const testimonials = [
  {
    quote:
      'We had strong SEO and still never appeared in ChatGPT answers. BuddyAds showed us the citation gaps — within weeks, Claude and Perplexity started recommending us.',
    name: 'Maya Chen',
    role: 'CMO, Northline Commerce',
    initials: 'MC',
  },
  {
    quote:
      'Prompt performance testing across nine models replaced guesswork. We finally know which knowledge pages move our AI Presence Score.',
    name: 'Jordan Blake',
    role: 'Head of Growth, Vertex Labs',
    initials: 'JB',
  },
  {
    quote:
      'Competitor AI analysis was the unlock. We saw exactly which rivals AI trusted — and what content made the difference.',
    name: 'Sofia Ramirez',
    role: 'Founder, Atelier Home',
    initials: 'SR',
  },
  {
    quote:
      'This is not advertising. It is the new discovery layer. BuddyAds is how we stay visible as search becomes conversational.',
    name: 'Alex Okonkwo',
    role: 'VP Marketing, Pulse Health',
    initials: 'AO',
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const active = testimonials[index];

  return (
    <Section
      id="testimonials"
      eyebrow="Testimonials"
      title="Teams winning the AI recommendation era"
      description="Operators optimizing for LLMs — not buying traditional ads."
    >
      <div className="relative mx-auto max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={active.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-black/[0.06] bg-[#FAFAFA] p-8 text-center premium-shadow dark:border-white/10 dark:bg-card md:p-12"
          >
            <p className="text-xl font-medium leading-relaxed tracking-tight text-foreground md:text-2xl">
              &ldquo;{active.quote}&rdquo;
            </p>
            <footer className="mt-8 flex flex-col items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full gradient-bg text-sm font-semibold text-white"
                aria-hidden
              >
                {active.initials}
              </div>
              <div>
                <cite className="not-italic text-sm font-semibold">{active.name}</cite>
                <p className="text-sm text-muted-foreground">{active.role}</p>
              </div>
            </footer>
          </motion.blockquote>
        </AnimatePresence>

        <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Testimonials">
          {testimonials.map((t, i) => (
            <button
              key={t.name}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show testimonial from ${t.name}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-brand' : 'w-2 bg-black/15 hover:bg-black/30 dark:bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
