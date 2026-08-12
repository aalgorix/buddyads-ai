import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ReportPayload } from './score';

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;

const DISCLAIMER =
  'LLM-related scores are evidence-based estimates from website signals and sampled model answers — not private model rankings.';

function wrapText(text: string, maxChars: number): string[] {
  const words = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word.length > maxChars ? word.slice(0, maxChars) : word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export async function renderReportPdf(report: ReportPayload, customerName: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const brand = rgb(0.15, 0.39, 0.92);
  const ink = rgb(0.07, 0.09, 0.15);
  const muted = rgb(0.42, 0.45, 0.5);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y < needed) {
      page.drawText('BuddyAds · AI Visibility Report · Confidential', {
        x: MARGIN,
        y: 28,
        size: 8,
        font,
        color: muted,
      });
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const write = (text: string, opts: { size?: number; bold?: boolean; max?: number } = {}) => {
    const size = opts.size ?? 10;
    const useFont = opts.bold ? bold : font;
    for (const row of wrapText(text, opts.max ?? 92)) {
      ensureSpace(36);
      page.drawText(row, { x: MARGIN, y, size, font: useFont, color: ink });
      y -= size + 4;
    }
  };

  const heading = (text: string) => {
    ensureSpace(48);
    y -= 8;
    write(text, { size: 13, bold: true });
    y -= 4;
  };

  write('BuddyAds', { size: 12, bold: true });
  write('AI Visibility Audit Report', { size: 18, bold: true });
  write(`Prepared for ${customerName}`, { size: 10 });
  write(report.brandName, { size: 14, bold: true });
  write(report.websiteUrl, { size: 10 });
  write(`Generated ${report.generatedAt.slice(0, 10)}`, { size: 9 });
  y -= 8;
  write(
    `Overall ${report.overall} · AEO ${report.aeo} · GEO ${report.geo} · LLM ${report.llmReady} · Grade ${report.grade}`,
    { size: 11, bold: true },
  );

  heading('Executive Summary');
  write(report.summary);

  heading('Priority Recommendations');
  report.recommendations.forEach((r, i) => {
    write(`${i + 1}. [${r.priority.toUpperCase()}] ${r.title}`, { size: 11, bold: true });
    write(r.detail, { size: 9 });
    write(`${r.difficulty} · ${r.estimatedTime} · ${r.expectedGain}`, { size: 9 });
    y -= 4;
  });

  if (report.llmEstimates.length) {
    heading('LLM Visibility Estimates');
    write(DISCLAIMER, { size: 8 });
    for (const m of report.llmEstimates) {
      write(`${m.model}: ${m.score}/100`, { size: 10, bold: true });
      write(m.insight, { size: 9 });
    }
  }

  heading('Competitor Insights');
  write(report.competitorInsights);

  heading('30-Day Roadmap');
  report.roadmap30Day.forEach((item, i) => write(`${i + 1}. ${item}`));

  heading('90-Day Roadmap');
  report.roadmap90Day.forEach((item, i) => write(`${i + 1}. ${item}`));

  heading('Next Steps');
  write(
    'Book a free AI strategy call at buddyads.agency/contact to turn this into a 30-day execution plan.',
  );
  write(DISCLAIMER, { size: 8 });

  page.drawText('BuddyAds · AI Visibility Report · Confidential', {
    x: MARGIN,
    y: 28,
    size: 8,
    font,
    color: muted,
  });

  return Buffer.from(await doc.save());
}

export async function saveReportPdf(
  jobId: string,
  report: ReportPayload,
  customerName: string,
): Promise<string> {
  const dir = path.resolve(__dirname, '../../../../storage/pdfs');
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${jobId}.pdf`);
  const buf = await renderReportPdf(report, customerName);
  await writeFile(filePath, buf);
  return filePath;
}
