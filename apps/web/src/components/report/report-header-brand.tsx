import Image from 'next/image';

export function ReportHeaderBrand({ inverted = true }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/aalgorix-logo.webp"
        alt="Aalgorix"
        width={156}
        height={36}
        className="h-8 w-auto"
        priority
      />
      <span
        className={`text-lg font-semibold tracking-tight ${inverted ? 'text-[#f4f1ea]' : 'text-[#14161c]'}`}
      >
        BuddyAds
      </span>
    </div>
  );
}
