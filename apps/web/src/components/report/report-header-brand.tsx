import Image from 'next/image';

export function ReportHeaderBrand({ inverted = true }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/aalgorix-logo.webp"
        alt="Aalgorix"
        width={220}
        height={52}
        className="h-12 w-auto md:h-14"
        priority
      />
      <span
        className={`text-xl font-semibold tracking-tight md:text-2xl ${inverted ? 'text-[#f4f1ea]' : 'text-[#14161c]'}`}
      >
        BuddyAds
      </span>
    </div>
  );
}
