import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
}

export function PageHero({ eyebrow, title, description, className }: PageHeroProps) {
  return (
    <div className={cn('relative overflow-hidden border-b border-black/[0.06] dark:border-white/10', className)}>
      <div className="pointer-events-none absolute inset-0 hero-glow opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-6 pb-14 pt-16 text-center md:pb-16 md:pt-20">
        {eyebrow && <p className="mb-3 text-sm font-medium text-brand">{eyebrow}</p>}
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function SimplePage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <PageHero title={title} description={description} />
      <div className="mx-auto max-w-3xl px-6 py-16">{children}</div>
    </>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-brand hover:opacity-80">
      {children}
    </Link>
  );
}
