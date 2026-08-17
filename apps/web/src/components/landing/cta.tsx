'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { checkVisibilityUrl } from '@/lib/urls';
import { Reveal } from '@/components/landing/reveal';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 hero-glow opacity-80" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <motion.div
            className="rounded-[2rem] border border-black/[0.08] bg-white/80 px-8 py-16 backdrop-blur-xl premium-shadow-lg dark:border-white/10 dark:bg-card/80 md:px-16 md:py-20"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Ready to be the brand AI recommends?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
              Start measuring your AI Visibility Score today — across ChatGPT, Gemini, Claude,
              Perplexity, and the next generation of assistants.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={checkVisibilityUrl}
                className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background transition-all hover:scale-[1.02] hover:opacity-90"
              >
                Check My AI Visibility
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-full border border-black/[0.1] bg-transparent px-8 text-base font-medium transition-all hover:bg-muted dark:border-white/15"
              >
                Book a Demo
              </Link>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
