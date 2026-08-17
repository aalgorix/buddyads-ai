'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type AvatarState = 'idle' | 'thinking' | 'speaking' | 'listening';

export function ConsultantAvatar({
  state = 'idle',
  size = 'md',
}: {
  state?: AvatarState;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';

  return (
    <div className={cn('relative shrink-0', dim)}>
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br from-[#6C63FF]/40 to-[#3B82F6]/30',
          state !== 'idle' && 'animate-pulse',
        )}
        animate={
          state === 'speaking' || state === 'listening'
            ? { scale: [1, 1.12, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className={cn(
          'relative flex h-full w-full items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-[#6C63FF] to-[#3B82F6] text-sm font-semibold text-white shadow-lg shadow-[#6C63FF]/25',
        )}
      >
        B
      </div>
      {(state === 'thinking' || state === 'speaking') && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
      )}
    </div>
  );
}

export function ThinkingDots({ label = 'Buddy is thinking' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3" aria-live="polite" aria-label={label}>
      <ConsultantAvatar state="thinking" size="sm" />
      <div className="glass flex items-center gap-1.5 rounded-2xl px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
