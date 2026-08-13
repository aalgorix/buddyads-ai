'use client';

import { useId } from 'react';

/** Premium BuddyAds logomark — layered arcs = multi-LLM visibility */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const gradA = `ba-a-${id}`;
  const gradB = `ba-b-${id}`;

  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradA} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.55" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#FB7185" />
        </linearGradient>
        <linearGradient id={gradB} x1="12" y1="8" x2="28" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="39" height="39" rx="11" fill={`url(#${gradA})`} />
      <path
        d="M11 25.5C14.2 20.2 17.5 17.5 20 17.5C22.5 17.5 25.8 20.2 29 25.5"
        stroke={`url(#${gradB})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M13.5 21C15.8 17.8 17.9 16 20 16C22.1 16 24.2 17.8 26.5 21"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="13" r="2.6" fill="white" />
      <circle cx="20" cy="27.5" r="1.8" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

export function BrandLockup({
  size = 'md',
  href = '/',
  inverted = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  inverted?: boolean;
}) {
  const mark = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const title =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg md:text-xl';
  const tag = size === 'lg' ? 'text-[11px]' : 'text-[10px]';

  return (
    <a href={href} className="group flex items-center gap-2.5">
      <span className="relative shrink-0 transition duration-300 group-hover:scale-[1.04]">
        <LogoMark className={`${mark} drop-shadow-sm`} />
        <span
          className="pointer-events-none absolute -inset-1 rounded-[14px] bg-gradient-to-br from-accent/25 to-cyan/25 opacity-0 blur-md transition group-hover:opacity-100"
          aria-hidden
        />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={`font-display font-bold tracking-tight ${title} ${inverted ? 'text-[#f4f1ea]' : 'text-ink'}`}
        >
          Buddy
          <span className="bg-gradient-to-r from-accent to-cyan bg-clip-text text-transparent">Ads</span>
        </span>
        <span
          className={`mt-1 font-semibold uppercase tracking-[0.16em] ${tag} ${inverted ? 'text-[#9aa0ab]' : 'text-muted'}`}
        >
          AI Visibility
        </span>
      </span>
    </a>
  );
}
