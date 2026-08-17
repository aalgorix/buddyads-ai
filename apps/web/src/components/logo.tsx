import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  href?: string;
}

export function Logo({ className, href = '/' }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-baseline gap-0 font-sans text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80',
        className,
      )}
      aria-label="BuddyAds.ai home"
    >
      <span>BuddyAds</span>
      <span className="gradient-text">AI</span>
    </Link>
  );
}
