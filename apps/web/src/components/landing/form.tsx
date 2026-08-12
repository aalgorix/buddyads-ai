'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

/** Landing CTA — full intake lives on /check-report (AdGenix-parity depth). */
export function VisibilityForm() {
  return (
    <motion.div
      id="audit"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65 }}
      className="mt-10 flex flex-wrap items-center gap-4"
    >
      <Link
        href="/check-report"
        className="btn-gradient inline-flex h-12 items-center rounded-xl px-8 text-sm font-semibold"
      >
        Check my AI visibility
      </Link>
      <p className="max-w-md text-sm text-muted">
        Full business intake · multi-LLM research · report + PDF by email
      </p>
    </motion.div>
  );
}
