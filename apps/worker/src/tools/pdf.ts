import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ReportPayload } from '../types/report';

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;

const DISCLAIMER =
  'BuddyScore is a proprietary BuddyAds.ai measurement based on observable AI responses and website signals. It is not an internal ranking score provided by OpenAI, Google, Anthropic, Perplexity, or any other AI provider.';

const navy = rgb(0.04, 0.06, 0.12);
const gold = rgb(0.83, 0.69, 0.47);
const paper = rgb(0.965, 0.957, 0.937);
const ink = rgb(0.07, 0.08, 0.1);
const muted = rgb(0.4, 0.42, 0.45);
const line = rgb(0.86, 0.84, 0.8);
const white = rgb(1, 1, 1);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    const w = font.widthOfTextAtSize(next, size);
    if (w > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function na(v: number | string | null | undefined): string {
  if (v == null || v === '') return 'N/A';
  return String(v);
}

export async function renderReportPdf(report: ReportPayload, customerName: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  drawCover(doc, font, bold, report, customerName);

  const ctx = {
    doc,
    font,
    bold,
    page: doc.addPage([PAGE_W, PAGE_H]),
    y: PAGE_H - MARGIN,
  };
  paintPaper(ctx.page);

  const ensure = (needed: number) => {
    if (ctx.y < needed) {
      footer(ctx.page, font, report);
      ctx.page = doc.addPage([PAGE_W, PAGE_H]);
      paintPaper(ctx.page);
      ctx.y = PAGE_H - MARGIN;
    }
  };

  const write = (text: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; max?: number } = {}) => {
    const size = opts.size ?? 10;
    const useFont = opts.bold ? bold : font;
    const color = opts.color ?? ink;
    const maxW = opts.max ?? PAGE_W - MARGIN * 2;
    for (const row of wrapText(text, useFont, size, maxW)) {
      ensure(36);
      ctx.page.drawText(row, { x: MARGIN, y: ctx.y, size, font: useFont, color });
      ctx.y -= size + 4;
    }
  };

  const heading = (num: string, title: string) => {
    ensure(56);
    ctx.y -= 10;
    ctx.page.drawText(num, { x: MARGIN, y: ctx.y, size: 9, font: bold, color: gold });
    ctx.y -= 16;
    write(title, { size: 14, bold: true });
    ctx.y -= 4;
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.y + 8, width: 36, height: 2, color: gold });
    ctx.y -= 8;
  };

  heading('02', 'Executive summary');
  write(report.executiveSummary?.where || report.summary);
  ctx.y -= 4;
  write(report.executiveSummary?.visibility || '');
  if (report.executiveSummary?.strengths?.length) {
    ctx.y -= 4;
    write('Doing well: ' + report.executiveSummary.strengths.join(' · '), { size: 9 });
  }
  if (report.executiveSummary?.gaps?.length) {
    write('Hurting visibility: ' + report.executiveSummary.gaps.join(' · '), { size: 9 });
  }
  if (report.executiveSummary?.next?.length) {
    write('Do next: ' + report.executiveSummary.next.join(' · '), { size: 9 });
  }

  heading('04', 'Research coverage');
  const cov = report.coverage;
  write(
    `Platforms ${na(cov?.platformsTested)} · Models ${na(cov?.modelsTested)} · Queries ${na(cov?.queriesTransacted)} · Responses ${na(cov?.responsesAnalyzed)} · Brands tracked ${na(cov?.brandsTracked)} · Citations ${na(cov?.citationsCollected)} · Confidence ${report.confidence}`,
    { size: 9 },
  );
  if (cov?.platformNames?.length) write('Tested: ' + cov.platformNames.join(', '), { size: 9 });

  heading('05', 'AI visibility at a glance');
  const sc = report.scores || {};
  write(
    `BuddyScore ${na(sc.buddyScore)} · AI Visibility ${na(sc.aiVisibility)} · AEO ${na(sc.aeo)} · GEO ${na(sc.geo)} · Technical ${na(sc.technical)} · Entity ${na(sc.entityStrength)} · Citation ${na(sc.citationStrength)} · Consistency ${na(sc.brandConsistency)} · Competitor advantage ${na(sc.competitorAdvantage)}`,
    { size: 9 },
  );

  heading('06', 'How each AI platform sees your brand');
  if (!report.platformPerformance?.length) {
    write('Insufficient data — no successful platform samples in this run.', { size: 9 });
  } else {
    write('Platform · Model · Queries · Mentions · Mention rate · Avg position · Citations · Visibility', { size: 8, bold: true });
    for (const p of report.platformPerformance) {
      write(
        `${p.platform} · ${p.model} · ${p.queries} · ${p.mentions} · ${na(p.mentionRate)}${p.mentionRate != null ? '%' : ''} · ${na(p.avgPosition)} · ${p.citations} · ${na(p.visibility)}`,
        { size: 9 },
      );
    }
  }

  if (report.strongestPlatform) {
    heading('07', 'Best & weakest performing AI');
    write(`Strongest: ${report.strongestPlatform.platform} — visibility ${na(report.strongestPlatform.visibility)}`, { bold: true, size: 10 });
    write(report.strongestPlatform.evidence, { size: 9 });
    write(report.strongestPlatform.interpretation, { size: 9 });
    if (report.weakestPlatform) {
      ctx.y -= 4;
      write(`Needs attention: ${report.weakestPlatform.platform} — visibility ${na(report.weakestPlatform.visibility)}`, { bold: true, size: 10 });
      write(report.weakestPlatform.evidence, { size: 9 });
      write(report.weakestPlatform.interpretation, { size: 9 });
    }
  }

  heading('08', 'What you are doing well');
  if (!report.strengths?.length) write('Insufficient data to claim strengths beyond on-site crawl signals.', { size: 9 });
  report.strengths?.forEach((s, i) => {
    write(`0${i + 1} — ${s.title}  (${s.metric})`, { bold: true, size: 10 });
    write(s.evidence, { size: 9 });
    write(s.impact, { size: 9, color: muted });
    ctx.y -= 3;
  });

  heading('09', 'Visibility gaps');
  if (!report.gaps?.length) write('No material visibility gaps could be evidenced in this sample.', { size: 9 });
  report.gaps?.forEach((g) => {
    write(`${g.title} · Impact ${g.impact || g.severity || 'N/A'} · ${g.area || ''}`, { bold: true, size: 10 });
    write(`${g.metric} — ${g.evidence}`, { size: 9 });
    ctx.y -= 3;
  });

  heading('10', 'What AI cannot find about you');
  if (!report.missingSignals?.length) write('No missing on-site signals were flagged from the crawled page.', { size: 9 });
  report.missingSignals?.forEach((m) => {
    write(m.signal, { bold: true, size: 10 });
    write(`${m.observed} ${m.recommendation}`, { size: 9 });
  });

  heading('11', 'Your AI competition');
  write(report.competitorInsights || 'Insufficient data.', { size: 9 });
  report.shareOfVoice?.forEach((row) => {
    write(`${row.isBrand ? '● ' : '○ '}${row.name}  ${row.mentions} mentions  share ${na(row.share)}${row.share != null ? '%' : ''}`, { size: 9 });
  });

  heading('16', 'Citation intelligence');
  write(`Own-domain citation rate: ${report.ownCitationRate == null ? 'N/A' : `${report.ownCitationRate}%`}`, { size: 9 });
  report.citedDomains?.slice(0, 10).forEach((d) => {
    write(`${d.domain}  ×${d.frequency}  ${d.platforms.join(', ')}${d.isOwn ? '  (your domain)' : ''}`, { size: 9 });
  });

  heading('23', 'Biggest opportunities');
  report.opportunities?.forEach((o) => {
    write(`#${o.rank} ${o.title}`, { bold: true, size: 10 });
    write(`Impact ${o.impact} · Difficulty ${o.difficulty} · Confidence ${o.confidence}`, { size: 8 });
    write(o.evidence, { size: 9 });
    ctx.y -= 3;
  });

  heading('24', 'How to do it better');
  report.howToDoBetter?.forEach((h) => {
    write(h.problem, { bold: true, size: 10 });
    write(`Why it matters: ${h.whyItMatters}`, { size: 9 });
    write(`Evidence: ${h.evidence}`, { size: 9 });
    write(`Action: ${h.recommendedAction}`, { size: 9 });
    write(`Implementation: ${h.implementation}`, { size: 9 });
    write(`Priority ${h.priority} · ${h.difficulty} · ${h.expectedImpact}`, { size: 8, color: muted });
    ctx.y -= 4;
  });

  heading('25', '7-day action plan');
  report.plan7Day?.forEach((d) => {
    write(`Day ${d.day} — ${d.title}: ${d.task}`, { size: 9 });
  });

  heading('26', '30-day roadmap');
  report.roadmap30?.forEach((w) => {
    write(`Week ${w.week} · ${w.theme}`, { bold: true, size: 10 });
    w.tasks.forEach((t) => write(`• ${t.task} (${t.connectedProblem})`, { size: 9 }));
  });

  heading('27', '90-day strategy');
  report.strategy90?.forEach((m) => {
    write(`Month ${m.month} · ${m.theme}`, { bold: true, size: 10 });
    m.tasks.forEach((t) => write(`• ${t}`, { size: 9 }));
  });

  heading('28', 'Methodology & confidence');
  report.methodologyNotes?.forEach((n) => write(`• ${n}`, { size: 8 }));
  ctx.y -= 6;
  write(report.confidenceReason, { size: 9, bold: true });
  ctx.y -= 6;
  write(DISCLAIMER, { size: 8, color: muted });

  heading('30', 'Final takeaway');
  write(report.finalTakeaway || report.summary);

  footer(ctx.page, font, report);
  return Buffer.from(await doc.save());
}

function paintPaper(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: paper });
}

function footer(page: PDFPage, font: PDFFont, report: ReportPayload) {
  page.drawText(`BuddyAds · AI Visibility Intelligence Report · ${report.brandName} · Confidential`, {
    x: MARGIN,
    y: 28,
    size: 8,
    font,
    color: muted,
  });
}

function drawCover(
  doc: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  report: ReportPayload,
  customerName: string,
) {
  const page = doc.addPage([PAGE_W, PAGE_H]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: navy });
  page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: gold });
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 132, color: rgb(0.06, 0.09, 0.16) });

  page.drawText('BUDDYADS', { x: MARGIN, y: PAGE_H - 56, size: 10, font: bold, color: gold });
  page.drawText('AI VISIBILITY INTELLIGENCE', { x: MARGIN, y: PAGE_H - 70, size: 8, font, color: rgb(0.7, 0.72, 0.76) });

  const title = 'AI Visibility Intelligence Report';
  page.drawText(title, { x: MARGIN, y: PAGE_H - 130, size: 22, font: bold, color: white });
  page.drawText('How AI sees, understands, recommends, and cites your brand', {
    x: MARGIN,
    y: PAGE_H - 152,
    size: 10,
    font,
    color: rgb(0.75, 0.76, 0.8),
  });

  page.drawText(report.brandName, { x: MARGIN, y: PAGE_H - 200, size: 18, font: bold, color: white });
  page.drawText(report.websiteUrl, { x: MARGIN, y: PAGE_H - 218, size: 10, font, color: rgb(0.65, 0.67, 0.72) });
  page.drawText(`Prepared for ${customerName}`, { x: MARGIN, y: PAGE_H - 236, size: 9, font, color: rgb(0.65, 0.67, 0.72) });

  const score = report.scores?.buddyScore ?? report.overall;
  page.drawText('BuddyScore', { x: MARGIN, y: PAGE_H - 300, size: 10, font, color: gold });
  page.drawText(score == null ? 'N/A' : String(score), { x: MARGIN, y: PAGE_H - 352, size: 48, font: bold, color: white });
  page.drawText('/ 100', { x: MARGIN + (score == null ? 70 : String(score).length * 28), y: PAGE_H - 330, size: 12, font, color: rgb(0.6, 0.62, 0.68) });
  page.drawText('AI Visibility', { x: MARGIN, y: PAGE_H - 372, size: 10, font, color: rgb(0.7, 0.72, 0.76) });
  page.drawText(`Grade ${report.grade}  ·  Confidence ${report.confidence}`, {
    x: MARGIN,
    y: PAGE_H - 390,
    size: 10,
    font: bold,
    color: gold,
  });

  page.drawText(`Report date  ${report.generatedAt.slice(0, 10)}`, { x: MARGIN, y: 168, size: 8, font, color: rgb(0.65, 0.67, 0.72) });
  page.drawText(`Analysis ID  ${report.analysisId}`, { x: MARGIN, y: 154, size: 8, font, color: rgb(0.65, 0.67, 0.72) });

  const cov = report.coverage;
  const kpis: [string, string][] = [
    ['AI Platforms Tested', na(cov?.platformsTested)],
    ['Queries Tested', na(cov?.queriesTransacted)],
    ['AI Responses Analyzed', na(cov?.responsesAnalyzed)],
    ['Brand Mentions', report.ownCitationRate != null || report.platformPerformance?.length ? mentionLabel(report) : 'N/A'],
    ['Citation Rate', report.ownCitationRate == null ? 'N/A' : `${report.ownCitationRate}%`],
    ['Competitors Analyzed', na(cov ? Math.max(0, cov.brandsTracked - 1) : null)],
  ];
  const colW = (PAGE_W - MARGIN * 2) / 6;
  kpis.forEach(([label, value], i) => {
    const x = MARGIN + i * colW;
    page.drawText(value, { x, y: 88, size: 12, font: bold, color: white });
    const lines = wrapText(label, font, 7, colW - 8);
    lines.forEach((ln, li) => {
      page.drawText(ln, { x, y: 72 - li * 9, size: 7, font, color: rgb(0.62, 0.64, 0.68) });
    });
  });

  page.drawText('Confidential  ·  BuddyAds.ai', { x: MARGIN, y: 22, size: 8, font, color: rgb(0.5, 0.52, 0.56) });
}

function mentionLabel(report: ReportPayload): string {
  const usable = report.coverage?.responsesAnalyzed;
  if (!usable) return 'N/A';
  const mentions = report.research?.filter((r) => r.brandMentioned && r.answer && !r.error).length;
  if (mentions == null) return 'N/A';
  return `${Math.round((mentions / usable) * 100)}%`;
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
