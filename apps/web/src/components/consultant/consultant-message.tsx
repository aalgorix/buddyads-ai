'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ConsultantAvatar } from './consultant-avatar';
import type { ConsultantMessage } from './types';

export function ConsultantMessageBubble({
  message,
  showAvatar,
}: {
  message: ConsultantMessage;
  showAvatar?: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && showAvatar !== false && (
        <ConsultantAvatar state={message.streaming ? 'speaking' : 'idle'} size="sm" />
      )}
      <div
        className={cn(
          'max-w-[min(100%,32rem)] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed md:text-[15px]',
          isUser
            ? 'rounded-br-md bg-foreground text-background'
            : 'glass rounded-bl-md text-foreground',
          message.streaming && 'opacity-90',
        )}
      >
        {message.text}
        {message.streaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand align-middle" />
        )}
      </div>
    </motion.div>
  );
}
