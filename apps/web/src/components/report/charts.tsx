import { na } from '@/lib/report-utils';
import type { CoOccurrence, ShareOfVoiceRow } from '@/lib/report-types';

export function ScoreRing({ value, size = 168, label = 'BuddyScore' }: { value: number | null; size?: number; label?: string }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  const dash = c * pct;
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className="overflow-visible">
      <circle cx="80" cy="80" r={r} fill="none" stroke="#ece8df" strokeWidth="10" />
      <circle
        cx="80"
        cy="80"
        r={r}
        fill="none"
        stroke="#c4a574"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 80 80)"
      />
      <text x="80" y="76" textAnchor="middle" className="fill-[#14161c]" style={{ fontSize: 36, fontFamily: 'Georgia, serif' }}>
        {na(value)}
      </text>
      <text x="80" y="96" textAnchor="middle" fill="#8b8680" style={{ fontSize: 9, letterSpacing: '0.16em' }}>
        {label.toUpperCase()}
      </text>
    </svg>
  );
}

export function SovBars({ rows }: { rows: ShareOfVoiceRow[] }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.share ?? r.mentions), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const w = ((row.share ?? row.mentions) / max) * 100;
        return (
          <div key={row.name}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className={row.isBrand ? 'font-semibold text-[#14161c]' : 'text-[#5c616b]'}>
                {row.isBrand ? row.name : row.name}
              </span>
              <span className="tabular-nums text-[#8b8680]">
                {row.share == null ? `${row.mentions} mentions` : `${row.share}%`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#ece8df]">
              <div
                className={`h-full rounded-full ${row.isBrand ? 'bg-[#14161c]' : 'bg-[#c4a574]'}`}
                style={{ width: `${Math.max(3, w)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CoNetwork({ brand, links }: { brand: string; links: CoOccurrence[] }) {
  if (!links.length) {
    return (
      <p className="text-sm text-[#8b8680]">
        Insufficient co-occurrence data — the brand was not named alongside other brands in this sample.
      </p>
    );
  }
  const max = Math.max(...links.map((l) => l.count), 1);
  const cx = 220;
  const cy = 160;
  const radius = 110;
  return (
    <div>
      <svg viewBox="0 0 440 320" className="h-auto w-full max-w-xl">
        {links.map((l, i) => {
          const angle = (i / links.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          const sw = 1 + (l.count / max) * 6;
          return (
            <g key={l.brand}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="#c4a574" strokeWidth={sw} strokeOpacity="0.85" />
              <circle cx={x} cy={y} r="22" fill="#fff" stroke="#e4dfd4" />
              <text x={x} y={y + 4} textAnchor="middle" fill="#14161c" style={{ fontSize: 8 }}>
                {l.brand.length > 14 ? `${l.brand.slice(0, 12)}…` : l.brand}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="36" fill="#0b1220" />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#f4f1ea" style={{ fontSize: 9, fontWeight: 600 }}>
          {brand.length > 16 ? `${brand.slice(0, 14)}…` : brand}
        </text>
      </svg>
      <p className="mt-2 text-sm text-[#5c616b]">
        These are the brands AI most frequently considers alongside you. Line thickness is co-occurrence frequency in
        this sample.
      </p>
    </div>
  );
}

export function EntityMap({
  nodes,
}: {
  nodes: { label: string; value: string | null; missing?: boolean }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((n) => (
        <div
          key={n.label}
          className={`rounded-2xl border p-4 ${
            n.missing || !n.value ? 'border-dashed border-[#d9c7a2] bg-[#fbf6ec]' : 'border-[#e4dfd4] bg-white'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b8680]">{n.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#14161c]">{n.value || 'Missing / not observed'}</p>
        </div>
      ))}
    </div>
  );
}
