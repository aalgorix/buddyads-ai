'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
      )}
      <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-muted md:text-lg">{description}</p>
      )}
    </div>
  );
}
