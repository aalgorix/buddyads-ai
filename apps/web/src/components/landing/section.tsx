import { cn } from '@/lib/utils';

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  align?: 'left' | 'center';
}

export function Section({
  id,
  children,
  className,
  containerClassName,
  eyebrow,
  title,
  description,
  align = 'center',
}: SectionProps) {
  return (
    <section id={id} className={cn('relative py-24 md:py-32', className)}>
      <div className={cn('mx-auto max-w-6xl px-6', containerClassName)}>
        {(eyebrow || title || description) && (
          <div
            className={cn(
              'mb-14 max-w-2xl md:mb-16',
              align === 'center' && 'mx-auto text-center',
            )}
          >
            {eyebrow && (
              <p className="mb-4 text-sm font-medium tracking-wide text-brand">{eyebrow}</p>
            )}
            {title && (
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {title}
              </h2>
            )}
            {description && (
              <p
                className={cn(
                  'mt-4 text-lg text-muted-foreground',
                  align === 'center' && 'mx-auto max-w-xl',
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
