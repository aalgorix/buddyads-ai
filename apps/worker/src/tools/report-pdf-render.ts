import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ReportPayload } from '../types/report';
import { enrichReportPayload } from './report-derived';

const W = 595;
const H = 842;
const M = 44;

const navy = rgb(0.043, 0.071, 0.125);
const gold = rgb(0.72, 0.58, 0.35);
const ink = rgb(0.07, 0.08, 0.1);
const muted = rgb(0.38, 0.4, 0.44);
const line = rgb(0.88, 0.86, 0.82);
const paper = rgb(0.985, 0.982, 0.975);
const white = rgb(1, 1, 1);
const good = rgb(0.12, 0.42, 0.3);
const bad = rgb(0.55, 0.18, 0.22);
const soft = rgb(0.96, 0.95, 0.93);

const TOTAL_PAGES = 7;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function para(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  maxW: number,
  color = ink,
  leading = 3.2,
): number {
  const rows = wrap(text, font, size, maxW);
  for (const row of rows) {
    page.drawText(row, { x, y, size, font, color });
    y -= size + leading;
  }
  return y;
}

function heading(page: PDFPage, bold: PDFFont, font: PDFFont, kicker: string, title: string, y: number): number {
  page.drawText(kicker, { x: M, y, size: 8, font: bold, color: gold });
  page.drawText(title, { x: M, y: y - 18, size: 16, font: bold, color: ink });
  page.drawRectangle({ x: M, y: y - 26, width: 28, height: 2, color: gold });
  return y - 42;
}

function footer(page: PDFPage, font: PDFFont, brandName: string, n: number) {
  page.drawLine({ start: { x: M, y: 36 }, end: { x: W - M, y: 36 }, thickness: 0.5, color: line });
  page.drawText(`BuddyAds  .  AI Visibility Report  .  ${brandName}  .  Confidential`, {
    x: M,
    y: 22,
    size: 7.5,
    font,
    color: muted,
  });
  page.drawText(`${n} / ${TOTAL_PAGES}`, { x: W - M - 22, y: 22, size: 7.5, font, color: muted });
}

function paint(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: paper });
}

function na(v: number | string | null | undefined): string {
  if (v == null || v === '') return 'N/A';
  return String(v);
}

function pct(v: number | null | undefined): string {
  if (v == null) return 'N/A';
  return `${v}%`;
}

function mentionRateLabel(r: ReportPayload): string {
  const usable = r.coverage?.responsesAnalyzed;
  if (!usable) return 'N/A';
  const mentions = r.research?.filter((row) => row.brandMentioned && row.answer && !row.error).length;
  if (mentions == null) return 'N/A';
  return `${Math.round((mentions / usable) * 100)}%`;
}

async function loadReportLogo(doc: PDFDocument): Promise<PDFImage | null> {
  const candidates = [
    path.resolve(process.cwd(), 'public/aalgorix-logo.png'),
    path.resolve(process.cwd(), 'apps/web/public/aalgorix-logo.png'),
    path.resolve(__dirname, '../../../../apps/web/public/aalgorix-logo.png'),
  ];
  for (const filePath of candidates) {
    try {
      const bytes = await readFile(filePath);
      return await doc.embedPng(bytes);
    } catch {
      // try next path
    }
  }
  return null;
}

function drawReportBrandHeader(page: PDFPage, font: PDFFont, bold: PDFFont, logo: PDFImage | null) {
  const y = H - 58;
  if (logo) {
    const logoH = 34;
    const logoW = (logo.width / logo.height) * logoH;
    page.drawImage(logo, { x: M, y: y - 8, width: logoW, height: logoH });
    page.drawText('BuddyAds', { x: M + logoW + 12, y: y - 2, size: 16, font: bold, color: white });
    return;
  }
  page.drawText('BuddyAds', { x: M, y, size: 16, font: bold, color: white });
}

// ---------------------------------------------------------------------------
// Page 1 - Cover
// ---------------------------------------------------------------------------

function page1Cover(
  doc: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  r: ReportPayload,
  customerName: string,
  logo: PDFImage | null,
) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: navy });
  page.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: gold });

  drawReportBrandHeader(page, font, bold, logo);

  page.drawText('AI Visibility Report', { x: M, y: H - 118, size: 26, font: bold, color: white });
  page.drawText('How AI assistants see, recommend, and cite your brand', {
    x: M,
    y: H - 140,
    size: 11,
    font,
    color: rgb(0.72, 0.74, 0.78),
  });

  page.drawText(r.brandName, { x: M, y: H - 188, size: 20, font: bold, color: white });
  page.drawText(r.websiteUrl, { x: M, y: H - 208, size: 10, font, color: rgb(0.62, 0.64, 0.7) });
  page.drawText(`Prepared for ${customerName}  .  ${r.generatedAt.slice(0, 10)}  .  Analysis ${r.analysisId}`, {
    x: M,
    y: H - 224,
    size: 9,
    font,
    color: rgb(0.62, 0.64, 0.7),
  });

  // BuddyScore
  const score = r.scores?.buddyScore ?? r.overall;
  page.drawText('BuddyScore', { x: M, y: H - 278, size: 10, font, color: gold });
  page.drawText(score == null ? 'N/A' : String(score), { x: M, y: H - 338, size: 56, font: bold, color: white });
  page.drawText('/ 100', {
    x: M + (score == null ? 70 : String(score).length * 32),
    y: H - 312,
    size: 12,
    font,
    color: rgb(0.55, 0.57, 0.62),
  });
  page.drawText(`Grade ${r.grade}   .   Confidence ${r.confidence}`, {
    x: M,
    y: H - 358,
    size: 10,
    font: bold,
    color: gold,
  });
  page.drawText(r.summary || '', { x: M, y: H - 376, size: 9, font, color: rgb(0.7, 0.72, 0.76) });

  // Best / worst LLM boxes
  const boxY = 318;
  page.drawRectangle({ x: M, y: boxY, width: 240, height: 72, color: rgb(0.08, 0.14, 0.22) });
  page.drawRectangle({ x: M + 255, y: boxY, width: 252, height: 72, color: rgb(0.08, 0.14, 0.22) });

  const best = r.strongestPlatform;
  page.drawText('BEST PERFORMING LLM', { x: M + 14, y: boxY + 52, size: 7, font: bold, color: gold });
  page.drawText(best?.platform || 'N/A', { x: M + 14, y: boxY + 32, size: 14, font: bold, color: white });
  page.drawText(
    best
      ? `Visibility ${na(best.visibility)}  .  Mention ${pct(best.mentionRate)}  .  Avg pos ${na(best.avgPosition)}`
      : '',
    { x: M + 14, y: boxY + 14, size: 8, font, color: rgb(0.7, 0.72, 0.76) },
  );

  const worst = r.weakestPlatform;
  page.drawText('WORST PERFORMING LLM', { x: M + 269, y: boxY + 52, size: 7, font: bold, color: gold });
  page.drawText(worst?.platform || 'N/A', { x: M + 269, y: boxY + 32, size: 14, font: bold, color: white });
  page.drawText(
    worst
      ? `Visibility ${na(worst.visibility)}  .  Mention ${pct(worst.mentionRate)}  .  Avg pos ${na(worst.avgPosition)}`
      : '',
    { x: M + 269, y: boxY + 14, size: 8, font, color: rgb(0.7, 0.72, 0.76) },
  );

  // KPIs
  const cov = r.coverage;
  const kpis: [string, string][] = [
    ['LLMs checked', na(cov?.platformsTested)],
    ['Queries transacted', na(cov?.queriesTransacted)],
    ['Responses analyzed', na(cov?.responsesAnalyzed)],
    ['Brand mention rate', mentionRateLabel(r)],
    ['Own-site citation rate', r.ownCitationRate == null ? 'N/A' : `${r.ownCitationRate}%`],
    ['Competitors tracked', na(cov ? Math.max(0, cov.brandsTracked - 1) : null)],
  ];
  kpis.forEach(([label, value], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + col * 168;
    const y = 168 - row * 64;
    page.drawText(value, { x, y: y + 18, size: 18, font: bold, color: white });
    page.drawText(label, { x, y, size: 8, font, color: rgb(0.62, 0.64, 0.7) });
  });

  // Platform names
  const names = cov?.platformNames?.join('  .  ') || '';
  if (names) {
    page.drawText(names, { x: M, y: 48, size: 8, font, color: rgb(0.55, 0.57, 0.62) });
  }

  page.drawText(`1 / ${TOTAL_PAGES}`, { x: W - M - 22, y: 22, size: 8, font, color: rgb(0.5, 0.52, 0.56) });
}

// ---------------------------------------------------------------------------
// Page 2 - How to read + executive summary + brand category tiers
// ---------------------------------------------------------------------------

function page2ReadAndSummary(doc: PDFDocument, font: PDFFont, bold: PDFFont, r: ReportPayload) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '02  .  HOW TO READ THIS REPORT', 'What the numbers mean', H - 52);

  const rules: [string, string][] = [
    [
      'BuddyScore (0-100)',
      'A BuddyAds composite of mention rate, recommendation position, citations, and on-site AI-readiness. It is not an official ranking from OpenAI, Google, Anthropic, or any other provider.',
    ],
    [
      'LLMs checked',
      `How many distinct AI assistants we queried. This run: ${na(r.coverage?.platformsTested)} platforms, ${na(r.coverage?.modelsTested)} models.`,
    ],
    [
      'Queries transacted',
      `Buyer-style prompts sent to those LLMs. This run: ${na(r.coverage?.queriesTransacted)} transactions, ${na(r.coverage?.responsesAnalyzed)} successful answers.`,
    ],
    [
      'Mention vs citation',
      'Mention = the model named your brand. Citation = it linked to your website. This report separates "named but not linked" from "named and linked."',
    ],
    [
      'Position',
      'When several brands are listed, 1 = first recommended. Lower is better. N/A means the brand was not listed.',
    ],
    [
      'Best / worst LLM',
      'Highest and lowest visibility among platforms with enough successful answers.',
    ],
  ];

  for (const [t, d] of rules) {
    page.drawRectangle({ x: M, y: y - 38, width: W - M * 2, height: 46, color: white });
    page.drawRectangle({ x: M, y: y - 38, width: 3, height: 46, color: gold });
    page.drawText(t, { x: M + 14, y: y - 4, size: 9, font: bold, color: ink });
    y = para(page, font, d, M + 14, y - 18, 8, W - M * 2 - 28, muted, 2.6) - 18;
  }

  // Executive summary
  y -= 8;
  y = heading(page, bold, font, '03  .  EXECUTIVE SUMMARY', `Where ${r.brandName} stands in AI answers`, y + 8);

  const exec = r.executiveSummary;
  if (exec?.where) y = para(page, font, exec.where, M, y, 10, W - M * 2, ink, 3.4) - 8;
  if (exec?.visibility) y = para(page, font, exec.visibility, M, y, 10, W - M * 2, ink, 3.4) - 10;

  // Brand category tier box
  const bc = r.brandCategory;
  page.drawRectangle({ x: M, y: y - 72, width: W - M * 2, height: 76, color: white });
  page.drawRectangle({ x: M, y: y - 72, width: 3, height: 76, color: gold });
  page.drawText('Your brand falls in this category', { x: M + 14, y: y - 14, size: 9, font: bold, color: ink });
  page.drawText((bc?.tier || 'N/A').toUpperCase(), { x: M + 14, y: y - 34, size: 14, font: bold, color: navy });
  para(page, font, bc?.summary || '', M + 14, y - 52, 8.5, W - M * 2 - 28, muted, 3);

  const tiers: [string, string][] = [
    ['Category leader', 'Default pick in most answers'],
    ['Known alternative', 'Named but not first'],
    ['Occasional mention', 'Named in some queries only'],
    ['Low visibility', 'Rarely appears'],
    ['Invisible', 'Not found in answers'],
  ];
  let tx = M + 14;
  const ty = y - 88;
  tiers.forEach(([label, note], i) => {
    const active = label === bc?.tier;
    page.drawRectangle({
      x: tx,
      y: ty - 4,
      width: 98,
      height: 28,
      color: active ? navy : soft,
      borderColor: active ? gold : line,
      borderWidth: active ? 1 : 0.5,
    });
    page.drawText(label, { x: tx + 6, y: ty + 10, size: 6.5, font: active ? bold : font, color: active ? white : ink });
    page.drawText(note, { x: tx + 6, y: ty, size: 5.5, font, color: active ? rgb(0.75, 0.76, 0.8) : muted });
    tx += 104;
  });

  footer(page, font, r.brandName, 2);
}

// ---------------------------------------------------------------------------
// Page 3 - Doing well / Doing poorly / Not doing (3 columns)
// ---------------------------------------------------------------------------

function page3GoodBadMissing(doc: PDFDocument, font: PDFFont, bold: PDFFont, r: ReportPayload) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '04  .  STRENGTHS, GAPS & MISSING SIGNALS', 'What you are doing well, badly, and not at all', H - 52);

  y = para(page, font, 'Every item is tied to observed LLM answers or the crawled site -- not generic SEO advice.', M, y, 9, W - M * 2, muted, 3) - 14;

  const colW = 161;
  const cols: { title: string; color: ReturnType<typeof rgb>; items: { t: string; m: string; b: string }[] }[] = [
    {
      title: 'Doing well',
      color: good,
      items: (r.strengths || []).slice(0, 3).map((s) => ({ t: s.title, m: s.metric, b: `${s.evidence} ${s.impact}` })),
    },
    {
      title: 'Doing poorly',
      color: bad,
      items: (r.gaps || []).slice(0, 3).map((g) => ({ t: g.title, m: g.metric, b: `${g.evidence} ${g.impact || ''}` })),
    },
    {
      title: 'Not doing',
      color: rgb(0.35, 0.38, 0.42),
      items: (r.missingSignals || []).slice(0, 3).map((ms) => ({ t: ms.signal, m: ms.observed, b: `${ms.whyItMatters} ${ms.recommendation}` })),
    },
  ];

  // Column headers
  cols.forEach((col, i) => {
    const x = M + i * (colW + 12);
    page.drawRectangle({ x, y: y - 16, width: colW, height: 22, color: col.color });
    page.drawText(col.title.toUpperCase(), { x: x + 8, y: y - 10, size: 8, font: bold, color: white });
  });

  let cy = y - 28;
  const maxRows = Math.max(...cols.map((c) => c.items.length));
  for (let row = 0; row < maxRows; row++) {
    let rowH = 0;
    cols.forEach((col, i) => {
      const item = col.items[row];
      if (!item) return;
      const x = M + i * (colW + 12);
      page.drawText(item.t, { x: x + 2, y: cy - 12, size: 8.5, font: bold, color: ink });
      page.drawText(item.m, { x: x + 2, y: cy - 26, size: 8, font: bold, color: col.color });
      const after = para(page, font, item.b, x + 2, cy - 40, 7.5, colW - 4, muted, 2.4);
      rowH = Math.max(rowH, cy - after);
    });
    cy -= rowH + 18;
  }

  // Synthesis callout
  y = cy - 8;
  const synthText = r.executiveSummary?.next?.length
    ? 'What to do next: ' + r.executiveSummary.next.join('. ') + '.'
    : 'Fix the missing layer and the weaker platforms have a chance to catch up.';
  page.drawRectangle({ x: M, y: y - 88, width: W - M * 2, height: 92, color: white });
  page.drawRectangle({ x: M, y: y - 88, width: 3, height: 92, color: gold });
  page.drawText('Read this as a system, not three isolated lists', { x: M + 14, y: y - 14, size: 9, font: bold, color: ink });
  para(page, font, synthText, M + 14, y - 32, 8.5, W - M * 2 - 28, muted, 3);

  footer(page, font, r.brandName, 3);
}

// ---------------------------------------------------------------------------
// Page 4 - LLM performance table + mention breakdown + winning/losing queries
// ---------------------------------------------------------------------------

function page4Llms(doc: PDFDocument, font: PDFFont, bold: PDFFont, r: ReportPayload) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '05  .  LLM PERFORMANCE', 'How each assistant treated the brand', H - 52);

  const cov = r.coverage;
  y = para(
    page, font,
    `${na(cov?.platformsTested)} LLMs checked. ${na(cov?.queriesTransacted)} queries transacted. ${na(cov?.responsesAnalyzed)} successful responses analyzed.`,
    M, y, 9, W - M * 2, muted, 3,
  ) - 16;

  // Table
  const headers = ['LLM', 'Queries', 'Mentions', 'Mention %', 'Avg pos.', 'Citations', 'Visibility'];
  const colsX = [M, M + 88, M + 148, M + 214, M + 286, M + 360, M + 438];

  page.drawRectangle({ x: M - 6, y: y - 8, width: W - M * 2 + 12, height: 22, color: navy });
  headers.forEach((h, i) => {
    page.drawText(h, { x: colsX[i], y: y - 2, size: 8, font: bold, color: white });
  });
  y -= 28;

  (r.platformPerformance || []).forEach((p, ri) => {
    if (ri % 2 === 0) {
      page.drawRectangle({ x: M - 6, y: y - 8, width: W - M * 2 + 12, height: 20, color: soft });
    }
    const cells = [p.platform, String(p.queries), String(p.mentions), pct(p.mentionRate), na(p.avgPosition), String(p.citations), na(p.visibility)];
    cells.forEach((cell, i) => {
      page.drawText(cell, { x: colsX[i], y, size: 9, font: i === 0 || i === 6 ? bold : font, color: ink });
    });
    y -= 20;
  });

  // Best / worst callout boxes
  y -= 18;
  const best = r.strongestPlatform;
  const worst = r.weakestPlatform;

  page.drawRectangle({ x: M, y: y - 78, width: 248, height: 88, color: white });
  page.drawRectangle({ x: M, y: y - 78, width: 3, height: 88, color: good });
  page.drawText(`Best -- ${best?.platform || 'N/A'}`, { x: M + 14, y: y - 8, size: 11, font: bold, color: good });
  para(page, font, best?.evidence || '', M + 14, y - 26, 8, 220, muted, 2.8);

  page.drawRectangle({ x: M + 260, y: y - 78, width: 247, height: 88, color: white });
  page.drawRectangle({ x: M + 260, y: y - 78, width: 3, height: 88, color: bad });
  page.drawText(`Worst -- ${worst?.platform || 'N/A'}`, { x: M + 274, y: y - 8, size: 11, font: bold, color: bad });
  para(page, font, worst?.evidence || '', M + 274, y - 26, 8, 218, muted, 2.8);

  y -= 104;

  // Mention breakdown boxes
  const mb = r.mentionBreakdown;
  page.drawText('Mention vs link -- how AI talked about you', { x: M, y, size: 11, font: bold, color: ink });
  y -= 18;

  const mentionBoxes: [string, string, string, ReturnType<typeof rgb>][] = [
    ['Brand mentioned, no link', `${mb?.mentionedNoLink ?? 0} answers`, pct(mb?.mentionedNoLinkRate), rgb(0.55, 0.38, 0.12)],
    ['Brand mentioned + your link', `${mb?.mentionedWithLink ?? 0} answers`, pct(mb?.mentionedWithLinkRate), good],
    ['No brand mention', `${mb?.noMention ?? 0} answers`, pct(mb?.noMentionRate), bad],
  ];
  mentionBoxes.forEach((box, i) => {
    const x = M + i * 172;
    page.drawRectangle({ x, y: y - 58, width: 160, height: 64, color: white });
    page.drawRectangle({ x, y: y - 58, width: 160, height: 4, color: box[3] });
    page.drawText(box[0], { x: x + 10, y: y - 18, size: 8, font: bold, color: ink });
    page.drawText(box[1], { x: x + 10, y: y - 36, size: 16, font: bold, color: navy });
    page.drawText(box[2], { x: x + 10, y: y - 50, size: 7.5, font, color: muted });
  });

  y -= 78;

  // Winning / losing queries (top 2 each)
  page.drawText('Query outcomes that matter', { x: M, y, size: 11, font: bold, color: ink });
  y -= 16;

  const wins = (r.winningQueries || []).slice(0, 2);
  const losses = (r.losingQueries || []).slice(0, 2);
  const outcomes: [string, string, string][] = [
    ...wins.map<[string, string, string]>((q) => ['WIN', q.query, `${q.platform} pos ${na(q.position)}. ${q.why || ''} ${q.opportunity || ''}`]),
    ...losses.map<[string, string, string]>((q) => ['LOSS', q.query, `${q.platform}. ${q.why || ''} ${q.missing || ''}`]),
  ];

  for (const [tag, q, note] of outcomes) {
    const tagColor = tag === 'WIN' ? good : bad;
    page.drawRectangle({ x: M, y: y - 6, width: 36, height: 14, color: tagColor });
    page.drawText(tag, { x: M + 6, y: y - 3, size: 7, font: bold, color: white });
    page.drawText(q, { x: M + 46, y: y - 2, size: 8.5, font: bold, color: ink });
    y = para(page, font, note, M + 46, y - 16, 8, W - M * 2 - 46, muted, 2.6) - 12;
  }

  footer(page, font, r.brandName, 4);
}

// ---------------------------------------------------------------------------
// Page 5 - Competition
// ---------------------------------------------------------------------------

function page5Competition(doc: PDFDocument, font: PDFFont, bold: PDFFont, r: ReportPayload) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '06  .  COMPETITION', 'Who AI recommends instead of you', H - 52);

  y = para(page, font, r.competitorInsights || 'Insufficient data on competitors.', M, y, 9, W - M * 2, muted, 3) - 18;

  const closest = (r.closestCompetitors || []).slice(0, 3);
  if (closest.length) {
    page.drawText('3 closest competitors  --  execution vs each', { x: M, y, size: 11, font: bold, color: ink });
    y -= 16;
    for (const c of closest) {
      page.drawText(`#${c.rank}  ${c.name}   ${pct(c.mentionRate)}  ${c.mentions} mentions`, {
        x: M, y, size: 10, font: bold, color: ink,
      });
      y = para(page, font, c.theyWinOn, M, y - 13, 8, W - M * 2, muted, 2.4) - 6;
      for (const [i, move] of c.moves.slice(0, 3).entries()) {
        y = para(page, font, `${i + 1}. ${move}`, M + 10, y, 8, W - M * 2 - 10, ink, 2.4) - 4;
      }
      y -= 8;
    }
  }

  // Share of voice table (you + top rivals)
  const sov = (r.shareOfVoice || []).slice(0, 5);
  const totalResp = r.coverage?.responsesAnalyzed || 0;
  page.drawText(`Share of voice in ${totalResp} answers`, { x: M, y, size: 11, font: bold, color: ink });
  y -= 18;
  page.drawRectangle({ x: M - 6, y: y - 6, width: W - M * 2 + 12, height: 20, color: navy });
  page.drawText('Brand', { x: M, y, size: 8, font: bold, color: white });
  page.drawText('Mentions', { x: M + 220, y, size: 8, font: bold, color: white });
  page.drawText('Share', { x: M + 300, y, size: 8, font: bold, color: white });
  page.drawText('Bar', { x: M + 360, y, size: 8, font: bold, color: white });
  y -= 24;

  sov.forEach((row, i) => {
    const share = row.share ?? 0;
    if (i % 2 === 0) page.drawRectangle({ x: M - 6, y: y - 8, width: W - M * 2 + 12, height: 20, color: soft });
    page.drawText(row.isBrand ? `${row.name}  (you)` : row.name, {
      x: M, y, size: 9, font: row.isBrand ? bold : font, color: ink,
    });
    page.drawText(String(row.mentions), { x: M + 220, y, size: 9, font, color: ink });
    page.drawText(pct(row.share), { x: M + 300, y, size: 9, font: bold, color: ink });
    page.drawRectangle({
      x: M + 360, y: y - 2, width: Math.max(8, share * 3.2), height: 8,
      color: row.isBrand ? gold : rgb(0.55, 0.58, 0.62),
    });
    y -= 20;
  });

  if (!closest.length) {
    y -= 16;
    const gaps = r.competitorGaps || [];
    if (gaps.length) {
      page.drawText('Where they beat you', { x: M, y, size: 11, font: bold, color: ink });
      y -= 14;
      for (const g of gaps.slice(0, 4)) {
        page.drawText(g.area, { x: M, y, size: 9, font: bold, color: ink });
        page.drawText(`${g.competitorName}: ${g.competitor}`, { x: M + 168, y, size: 8, font, color: muted });
        y = para(page, font, g.gap, M, y - 14, 8, W - M * 2, muted, 2.6) - 10;
      }
    }
  }

  footer(page, font, r.brandName, 5);
}

// ---------------------------------------------------------------------------
// Page 6 - How to do better (top 3) + final takeaway
// ---------------------------------------------------------------------------

function page6Better(doc: PDFDocument, font: PDFFont, bold: PDFFont, r: ReportPayload) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '07  .  EXPLORE HOW TO DO IT BETTER', 'Highest-leverage moves', H - 52);

  y = para(page, font, 'Three priorities surfaced from this analysis. Full playbooks, timelines, and per-platform tactics are available on a strategy call.', M, y, 9, W - M * 2, muted, 3) - 12;

  const actions = (r.howToDoBetter || []).slice(0, 3);
  actions.forEach((h, i) => {
    const n = String(i + 1);
    page.drawCircle({ x: M + 8, y: y + 2, size: 8, color: navy });
    page.drawText(n, { x: M + 5.5, y: y - 1, size: 8, font: bold, color: white });
    page.drawText(h.problem, { x: M + 24, y, size: 10, font: bold, color: ink });
    y = para(page, font, `${h.whyItMatters} ${h.recommendedAction}`, M + 24, y - 16, 8.5, W - M * 2 - 24, muted, 2.8) - 14;
  });

  // Final takeaway box
  y -= 8;
  page.drawRectangle({ x: M, y: y - 100, width: W - M * 2, height: 104, color: navy });
  page.drawText('Final takeaway', { x: M + 14, y: y - 16, size: 9, font: bold, color: gold });
  para(page, font, r.finalTakeaway || r.summary, M + 14, y - 34, 8.5, W - M * 2 - 28, rgb(0.88, 0.89, 0.9), 3);
  page.drawText('rohit@buddyads.agency', { x: M + 14, y: y - 88, size: 8, font, color: gold });

  footer(page, font, r.brandName, 6);
}

// ---------------------------------------------------------------------------
// Page 7 - Strategy by LLM + CTA
// ---------------------------------------------------------------------------

function page7LlmStrategy(doc: PDFDocument, font: PDFFont, bold: PDFFont, r: ReportPayload) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '08  .  STRATEGY BY LLM', 'One read per assistant -- full playbooks on a strategy call', H - 52);

  y = para(page, font, 'Each LLM needs a different lever. Connect with us for a tailored strategy call to get the full roadmap per platform.', M, y, 9, W - M * 2, muted, 3) - 14;

  (r.llmStrategies || []).forEach(({ platform, tag, note }, i) => {
    if (i % 2 === 0) {
      page.drawRectangle({ x: M - 6, y: y - 52, width: W - M * 2 + 12, height: 56, color: soft });
    }
    page.drawText(platform, { x: M, y: y - 4, size: 10, font: bold, color: ink });
    page.drawRectangle({ x: M + 108, y: y - 10, width: 108, height: 14, color: navy });
    page.drawText(tag, { x: M + 114, y: y - 7, size: 7, font: bold, color: white });
    y = para(page, font, note, M, y - 22, 8.5, W - M * 2, muted, 2.6) - 16;
  });

  // CTA box
  y -= 10;
  page.drawRectangle({ x: M, y: y - 118, width: W - M * 2, height: 122, color: navy });
  page.drawText('Want the full strategy?', { x: M + 16, y: y - 20, size: 12, font: bold, color: white });
  para(
    page, font,
    'This report shows where you stand. A strategy call covers the how: exact pages to ship, prompts to re-test, citation targets per LLM, and a 30/60/90-day plan built for your category.',
    M + 16, y - 40, 9, W - M * 2 - 32, rgb(0.82, 0.84, 0.86), 3.2,
  );
  page.drawRectangle({ x: M + 16, y: y - 88, width: 200, height: 28, color: gold });
  page.drawText('Book a strategy call', { x: M + 28, y: y - 80, size: 10, font: bold, color: navy });
  page.drawText('buddyads.agency/contact  .  rohit@buddyads.agency', {
    x: M + 16, y: y - 108, size: 8, font, color: rgb(0.7, 0.72, 0.76),
  });

  footer(page, font, r.brandName, 7);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function renderStructuredReportPdf(
  report: ReportPayload,
  customerName: string,
): Promise<Buffer> {
  const r = enrichReportPayload(report);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadReportLogo(doc);

  page1Cover(doc, font, bold, r, customerName, logo);
  page2ReadAndSummary(doc, font, bold, r);
  page3GoodBadMissing(doc, font, bold, r);
  page4Llms(doc, font, bold, r);
  page5Competition(doc, font, bold, r);
  page6Better(doc, font, bold, r);
  page7LlmStrategy(doc, font, bold, r);

  return Buffer.from(await doc.save());
}
