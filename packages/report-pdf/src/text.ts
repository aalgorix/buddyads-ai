export function truncateAtWord(text: string, maxChars: number): string {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxChars) return t;
  const slice = t.slice(0, maxChars);
  const cut = slice.lastIndexOf(' ');
  const base = (cut > 24 ? slice.slice(0, cut) : slice).trim();
  return `${base}...`;
}

export function competitorNoun(n: number): string {
  if (n <= 0) return 'No competitors could be reliably identified from this sample';
  if (n === 1) return '1 closest competitor';
  return `${n} closest competitors`;
}
