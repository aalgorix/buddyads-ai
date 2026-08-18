/**
 * SAMPLE PDF ONLY — not wired into production.
 * Preview of the proposed 6-page AI Visibility report.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

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

const TOTAL_PAGES = 7;

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  page1Cover(doc, font, bold);
  page2ReadAndSummary(doc, font, bold);
  page3GoodBadMissing(doc, font, bold);
  page4Llms(doc, font, bold);
  page5Competition(doc, font, bold);
  page6Better(doc, font, bold);
  page7LlmStrategy(doc, font, bold);

  const out = path.resolve(__dirname, '../../../BuddyAds-AI-Visibility-Report-Preview.pdf');
  await writeFile(out, await doc.save());
  console.log(`Wrote ${out}`);
}

function footer(page: PDFPage, font: PDFFont, n: number) {
  page.drawLine({
    start: { x: M, y: 36 },
    end: { x: W - M, y: 36 },
    thickness: 0.5,
    color: line,
  });
  page.drawText('BuddyAds  ·  AI Visibility Report  ·  Sample preview  ·  Confidential', {
    x: M,
    y: 22,
    size: 7.5,
    font,
    color: muted,
  });
  page.drawText(`${n} / ${TOTAL_PAGES}`, {
    x: W - M - 22,
    y: 22,
    size: 7.5,
    font,
    color: muted,
  });
}

function paint(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: paper });
}

function heading(page: PDFPage, bold: PDFFont, font: PDFFont, kicker: string, title: string, y: number) {
  page.drawText(kicker, { x: M, y, size: 8, font: bold, color: gold });
  page.drawText(title, { x: M, y: y - 18, size: 16, font: bold, color: ink });
  page.drawRectangle({ x: M, y: y - 26, width: 28, height: 2, color: gold });
  return y - 42;
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
) {
  const rows = wrap(text, font, size, maxW);
  for (const row of rows) {
    page.drawText(row, { x, y, size, font, color });
    y -= size + leading;
  }
  return y;
}

function page1Cover(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: navy });
  page.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: gold });

  page.drawText('BUDDYADS', { x: M, y: H - 52, size: 10, font: bold, color: gold });
  page.drawText('AI VISIBILITY INTELLIGENCE', {
    x: M + 78,
    y: H - 52,
    size: 8,
    font,
    color: rgb(0.7, 0.72, 0.76),
  });
  page.drawText('SAMPLE PREVIEW  ·  NOT A LIVE CUSTOMER REPORT', {
    x: M,
    y: H - 68,
    size: 7.5,
    font,
    color: rgb(0.62, 0.64, 0.7),
  });

  page.drawText('AI Visibility Report', { x: M, y: H - 118, size: 26, font: bold, color: white });
  page.drawText('How AI assistants see, recommend, and cite your brand', {
    x: M,
    y: H - 140,
    size: 11,
    font,
    color: rgb(0.72, 0.74, 0.78),
  });

  page.drawText('Northline Analytics', { x: M, y: H - 188, size: 20, font: bold, color: white });
  page.drawText('https://northline.ai', { x: M, y: H - 208, size: 10, font, color: rgb(0.62, 0.64, 0.7) });
  page.drawText('Prepared for Priya Shah  ·  17 August 2026  ·  Analysis NL-4821', {
    x: M,
    y: H - 224,
    size: 9,
    font,
    color: rgb(0.62, 0.64, 0.7),
  });

  page.drawText('BuddyScore', { x: M, y: H - 278, size: 10, font, color: gold });
  page.drawText('61', { x: M, y: H - 338, size: 56, font: bold, color: white });
  page.drawText('/ 100', { x: M + 78, y: H - 312, size: 12, font, color: rgb(0.55, 0.57, 0.62) });
  page.drawText('Grade C+   ·   Confidence Medium', {
    x: M,
    y: H - 358,
    size: 10,
    font: bold,
    color: gold,
  });
  page.drawText('Visible on some assistants. Rarely the first recommendation. Almost never cited.', {
    x: M,
    y: H - 376,
    size: 9,
    font,
    color: rgb(0.7, 0.72, 0.76),
  });

  // Best / worst
  const boxY = 318;
  page.drawRectangle({ x: M, y: boxY, width: 240, height: 72, color: rgb(0.08, 0.14, 0.22) });
  page.drawRectangle({ x: M + 255, y: boxY, width: 252, height: 72, color: rgb(0.08, 0.14, 0.22) });
  page.drawText('BEST PERFORMING LLM', { x: M + 14, y: boxY + 52, size: 7, font: bold, color: gold });
  page.drawText('ChatGPT', { x: M + 14, y: boxY + 32, size: 14, font: bold, color: white });
  page.drawText('Visibility 86  ·  4/4 mentions  ·  avg position 1.8', {
    x: M + 14,
    y: boxY + 14,
    size: 8,
    font,
    color: rgb(0.7, 0.72, 0.76),
  });
  page.drawText('WORST PERFORMING LLM', { x: M + 269, y: boxY + 52, size: 7, font: bold, color: gold });
  page.drawText('Grok', { x: M + 269, y: boxY + 32, size: 14, font: bold, color: white });
  page.drawText('Visibility 28  ·  1/4 mentions  ·  0 citations', {
    x: M + 269,
    y: boxY + 14,
    size: 8,
    font,
    color: rgb(0.7, 0.72, 0.76),
  });

  const kpis: [string, string][] = [
    ['LLMs checked', '6'],
    ['Queries transacted', '24'],
    ['Responses analyzed', '22'],
    ['Brand mention rate', '41%'],
    ['Own-site citation rate', '12%'],
    ['Competitors tracked', '4'],
  ];
  kpis.forEach(([label, value], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + col * 168;
    const y = 168 - row * 64;
    page.drawText(value, { x, y: y + 18, size: 18, font: bold, color: white });
    page.drawText(label, { x, y, size: 8, font, color: rgb(0.62, 0.64, 0.7) });
  });

  page.drawText('ChatGPT  ·  Gemini  ·  Claude  ·  Perplexity  ·  Copilot  ·  Grok', {
    x: M,
    y: 48,
    size: 8,
    font,
    color: rgb(0.55, 0.57, 0.62),
  });
  page.drawText('1 / 7', { x: W - M - 22, y: 22, size: 8, font, color: rgb(0.5, 0.52, 0.56) });
}

function page2ReadAndSummary(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '02  ·  HOW TO READ THIS REPORT', 'What the numbers mean', H - 52);

  const rules: [string, string][] = [
    [
      'BuddyScore (0–100)',
      'A BuddyAds composite of mention rate, recommendation position, citations, and on-site AI-readiness. It is not an official ranking from OpenAI, Google, Anthropic, or any other provider.',
    ],
    [
      'LLMs checked',
      'How many distinct AI assistants we actually queried in this run. This sample: ChatGPT, Gemini, Claude, Perplexity, Copilot, Grok.',
    ],
    [
      'Queries transacted',
      'Buyer-style prompts sent to those LLMs (unique questions × platforms). This sample: 24 transactions, 22 successful answers.',
    ],
    [
      'Mention vs citation',
      'Mention = the model named your brand. Citation = it linked to your website. This report separates “named but not linked” from “named and linked.”',
    ],
    [
      'Position',
      'When several brands are listed, 1 = first recommended. Lower is better. N/A means the brand was not listed.',
    ],
    [
      'Best / worst LLM',
      'Highest and lowest visibility among platforms with enough successful answers. Small gaps under 5 points are noise at Medium confidence.',
    ],
  ];

  for (const [t, d] of rules) {
    page.drawRectangle({ x: M, y: y - 38, width: W - M * 2, height: 46, color: white });
    page.drawRectangle({ x: M, y: y - 38, width: 3, height: 46, color: gold });
    page.drawText(t, { x: M + 14, y: y - 4, size: 9, font: bold, color: ink });
    y = para(page, font, d, M + 14, y - 18, 8, W - M * 2 - 28, muted, 2.6) - 18;
  }

  y -= 8;
  y = heading(page, bold, font, '03  ·  EXECUTIVE SUMMARY', 'Where Northline stands in AI answers', y + 8);

  y = para(
    page,
    font,
    'Northline is known inside ChatGPT and reasonably visible on Claude, but is not the default recommendation in this category. Across 22 successful answers, the brand was named in 41% of them and cited as a source in only 12%. HubSpot is mentioned more often and usually earlier.',
    M,
    y,
    10,
    W - M * 2,
    ink,
    3.4,
  );
  y -= 8;
  y = para(
    page,
    font,
    'The pattern is consistent: assistants describe Northline accurately when they know it (mid-market analytics for revenue teams), then lose the recommendation to larger vendors that own comparison pages, review sites, and citation-friendly documentation. Grok and Copilot barely surface the brand at all.',
    M,
    y,
    10,
    W - M * 2,
    ink,
    3.4,
  );
  y -= 10;
  y = para(
    page,
    font,
    'Priority is not “more content.” It is becoming easier to recommend: comparison proof, third-party citations, and entity clarity so weaker platforms can retrieve the same facts ChatGPT already uses.',
    M,
    y,
    10,
    W - M * 2,
    ink,
    3.4,
  );

  y -= 14;
  page.drawRectangle({ x: M, y: y - 72, width: W - M * 2, height: 76, color: white });
  page.drawRectangle({ x: M, y: y - 72, width: 3, height: 76, color: gold });
  page.drawText('Your brand falls in this category', {
    x: M + 14,
    y: y - 14,
    size: 9,
    font: bold,
    color: ink,
  });
  page.drawText('KNOWN ALTERNATIVE', {
    x: M + 14,
    y: y - 34,
    size: 14,
    font: bold,
    color: navy,
  });
  para(
    page,
    font,
    'Northline is recognised in the category (mid-market revenue analytics) but is not the default recommendation. AI names you when prompted, rarely leads the shortlist, and almost never cites your site. One tier below category leaders like HubSpot.',
    M + 14,
    y - 52,
    8.5,
    W - M * 2 - 28,
    muted,
    3,
  );

  const tiers = [
    ['Category leader', 'Default pick in most answers'],
    ['Known alternative', 'You are here'],
    ['Occasional mention', 'Named in some queries only'],
    ['Low visibility', 'Rarely appears'],
    ['Invisible', 'Not found in answers'],
  ];
  let tx = M + 14;
  const ty = y - 88;
  tiers.forEach(([label, note], i) => {
    const active = i === 1;
    page.drawRectangle({
      x: tx,
      y: ty - 4,
      width: 98,
      height: 28,
      color: active ? navy : soft,
      borderColor: active ? gold : line,
      borderWidth: active ? 1 : 0.5,
    });
    page.drawText(label, {
      x: tx + 6,
      y: ty + 10,
      size: 6.5,
      font: active ? bold : font,
      color: active ? white : ink,
    });
    page.drawText(note, {
      x: tx + 6,
      y: ty,
      size: 5.5,
      font,
      color: active ? rgb(0.75, 0.76, 0.8) : muted,
    });
    tx += 104;
  });

  footer(page, font, 2);
}

function page3GoodBadMissing(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(
    page,
    bold,
    font,
    '04  ·  AFTER THE SUMMARY',
    'What you are doing well, badly, and not at all',
    H - 52,
  );

  y = para(
    page,
    font,
    'These three lists sit directly under the executive summary. Every item is tied to observed LLM answers or the crawled site — not generic SEO advice.',
    M,
    y,
    9,
    W - M * 2,
    muted,
    3,
  );
  y -= 14;

  const colW = 161;
  const cols: {
    title: string;
    color: ReturnType<typeof rgb>;
    items: [string, string, string][];
  }[] = [
    {
      title: 'Doing well',
      color: good,
      items: [
        [
          'Category language is clear',
          'Entity match 82',
          'When named, models describe Northline as “analytics for B2B revenue teams” — aligned with the homepage H1.',
        ],
        [
          'ChatGPT already recommends you',
          '4/4 mentions',
          'On “best analytics for mid-market SaaS,” ChatGPT listed Northline first or second in every successful answer.',
        ],
        [
          'Product facts are crawlable',
          'Schema: Organization',
          'JSON-LD Organization + Product names are present. Claude reused those product names twice without inventing extras.',
        ],
      ],
    },
    {
      title: 'Doing poorly',
      color: bad,
      items: [
        [
          'Rarely the first pick',
          'Avg position 2.7',
          'Even on platforms that mention you, HubSpot or Salesforce is listed earlier in 14 of 22 answers.',
        ],
        [
          'Almost never cited',
          '12% citation rate',
          'Only 3 answers used northline.ai as a source. Perplexity cited G2 and HubSpot docs instead.',
        ],
        [
          'Uneven across assistants',
          'Vis. 86 vs 28',
          'ChatGPT visibility 86; Copilot 33; Grok 28. Buyers using Microsoft or xAI will not find you.',
        ],
      ],
    },
    {
      title: 'Not doing',
      color: rgb(0.35, 0.38, 0.42),
      items: [
        [
          'No comparison pages',
          '0 / vs pages',
          'Crawl found no Northline vs HubSpot (or similar). Models invent the comparison from competitor sites.',
        ],
        [
          'No FAQ / speakable Q&A',
          'FAQ schema: none',
          'Zero question headings on the homepage. Assistants have no extractable “who is this for?” block.',
        ],
        [
          'No third-party proof cluster',
          '0 review citations',
          'No G2, Gartner, or customer-story URLs in answers. Competitors supply the proof layer you do not.',
        ],
      ],
    },
  ];

  cols.forEach((col, i) => {
    const x = M + i * (colW + 12);
    page.drawRectangle({ x, y: y - 16, width: colW, height: 22, color: col.color });
    page.drawText(col.title.toUpperCase(), {
      x: x + 8,
      y: y - 10,
      size: 8,
      font: bold,
      color: white,
    });
  });

  let cy = y - 28;
  for (let r = 0; r < 3; r++) {
    let rowH = 0;
    cols.forEach((col, i) => {
      const x = M + i * (colW + 12);
      const [title, metric, body] = col.items[r];
      page.drawText(title, { x: x + 2, y: cy - 12, size: 8.5, font: bold, color: ink });
      page.drawText(metric, { x: x + 2, y: cy - 26, size: 8, font: bold, color: col.color });
      const after = para(page, font, body, x + 2, cy - 40, 7.5, colW - 4, muted, 2.4);
      rowH = Math.max(rowH, cy - after);
    });
    cy -= rowH + 18;
  }

  y = cy - 8;
  page.drawRectangle({ x: M, y: y - 88, width: W - M * 2, height: 92, color: white });
  page.drawRectangle({ x: M, y: y - 88, width: 3, height: 92, color: gold });
  page.drawText('Read this as a system, not three isolated lists', {
    x: M + 14,
    y: y - 14,
    size: 9,
    font: bold,
    color: ink,
  });
  para(
    page,
    font,
    'What you do well (clear category language) is why ChatGPT can recommend you. What you do poorly (late position, weak citations) is why you lose the shortlist. What you are not doing (comparisons, FAQ, third-party proof) is why Gemini, Copilot, and Grok have nothing reliable to retrieve. Fix the missing layer and the weak platforms have a chance to catch ChatGPT — not the other way around.',
    M + 14,
    y - 32,
    8.5,
    W - M * 2 - 28,
    muted,
    3,
  );

  footer(page, font, 3);
}

function page4Llms(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '05  ·  LLM PERFORMANCE', 'How each assistant treated the brand', H - 52);

  y = para(
    page,
    font,
    '6 LLMs checked. 24 queries transacted (4 buyer prompts × 6 platforms). 22 successful responses analyzed. Prompts covered: category recommendation, alternative-to-HubSpot, mid-market analytics, and “who should we shortlist.”',
    M,
    y,
    9,
    W - M * 2,
    muted,
    3,
  );
  y -= 16;

  const headers = ['LLM', 'Queries', 'Mentions', 'Mention %', 'Avg pos.', 'Citations', 'Visibility'];
  const rows = [
    ['ChatGPT', '4', '4', '100%', '1.8', '2', '86'],
    ['Claude', '4', '3', '75%', '2.3', '1', '71'],
    ['Perplexity', '4', '2', '50%', '2.5', '2', '62'],
    ['Gemini', '4', '2', '50%', '3.0', '0', '54'],
    ['Copilot', '4', '1', '25%', '4.0', '0', '33'],
    ['Grok', '4', '1', '25%', 'N/A', '0', '28'],
  ];
  const colsX = [M, M + 88, M + 148, M + 214, M + 286, M + 360, M + 438];

  page.drawRectangle({ x: M - 6, y: y - 8, width: W - M * 2 + 12, height: 22, color: navy });
  headers.forEach((h, i) => {
    page.drawText(h, { x: colsX[i], y: y - 2, size: 8, font: bold, color: white });
  });
  y -= 28;
  rows.forEach((row, ri) => {
    if (ri % 2 === 0) {
      page.drawRectangle({ x: M - 6, y: y - 8, width: W - M * 2 + 12, height: 20, color: soft });
    }
    row.forEach((cell, i) => {
      page.drawText(cell, {
        x: colsX[i],
        y,
        size: 9,
        font: i === 0 || i === 6 ? bold : font,
        color: ink,
      });
    });
    y -= 20;
  });

  y -= 18;
  page.drawRectangle({ x: M, y: y - 78, width: 248, height: 88, color: white });
  page.drawRectangle({ x: M, y: y - 78, width: 3, height: 88, color: good });
  page.drawText('Best — ChatGPT', { x: M + 14, y: y - 8, size: 11, font: bold, color: good });
  para(
    page,
    font,
    'Named Northline in every successful answer and placed it 1st or 2nd. Cited northline.ai twice. This is the only assistant that behaves like it has a stable entity for the brand.',
    M + 14,
    y - 26,
    8,
    220,
    muted,
    2.8,
  );

  page.drawRectangle({ x: M + 260, y: y - 78, width: 247, height: 88, color: white });
  page.drawRectangle({ x: M + 260, y: y - 78, width: 3, height: 88, color: bad });
  page.drawText('Worst — Grok', { x: M + 274, y: y - 8, size: 11, font: bold, color: bad });
  para(
    page,
    font,
    'One weak mention, no position, no citation. Answered the category with HubSpot, Tableau, and “enterprise BI tools.” Northline is not in its retrieval set for this query class.',
    M + 274,
    y - 26,
    8,
    218,
    muted,
    2.8,
  );

  y -= 104;

  page.drawText('Mention vs link — how AI talked about you', { x: M, y, size: 11, font: bold, color: ink });
  y -= 18;

  const mentionBoxes: [string, string, string, ReturnType<typeof rgb>][] = [
    [
      'Brand mentioned, no link',
      '7 answers',
      '41% of mentions',
      rgb(0.55, 0.38, 0.12),
    ],
    [
      'Brand mentioned + your link',
      '3 answers',
      '14% of all answers',
      good,
    ],
    [
      'No brand mention',
      '12 answers',
      '55% of all answers',
      bad,
    ],
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
  para(
    page,
    font,
    'Most visibility is “name only.” ChatGPT and Claude mention Northline but often without linking northline.ai. Perplexity is the only platform that cited your domain twice. Mentions without links do not send traffic or reinforce authority.',
    M,
    y,
    8.5,
    W - M * 2,
    muted,
    3,
  );
  y -= 22;

  page.drawText('Query outcomes that matter', { x: M, y, size: 11, font: bold, color: ink });
  y -= 16;

  const outcomes: [string, string, string][] = [
    [
      'WIN',
      '“Best analytics platforms for mid-market SaaS”',
      'ChatGPT #1 Northline, Claude #2. Only prompt where you lead the list.',
    ],
    [
      'WIN',
      '“Tools like HubSpot but for revenue analytics”',
      'Claude named Northline with a correct product description. Perplexity cited your pricing page.',
    ],
    [
      'LOSS',
      '“Who should we shortlist for BI in 2026?”',
      'Gemini and Copilot: Tableau, Power BI, Looker. Northline absent. Grok same list.',
    ],
    [
      'LOSS',
      '“Northline vs HubSpot analytics”',
      'No model had a dedicated comparison. Perplexity cited a HubSpot blog. You did not appear as a peer.',
    ],
  ];
  for (const [tag, q, note] of outcomes) {
    const tagColor = tag === 'WIN' ? good : bad;
    page.drawRectangle({ x: M, y: y - 6, width: 36, height: 14, color: tagColor });
    page.drawText(tag, { x: M + 6, y: y - 3, size: 7, font: bold, color: white });
    page.drawText(q, { x: M + 46, y: y - 2, size: 8.5, font: bold, color: ink });
    y = para(page, font, note, M + 46, y - 16, 8, W - M * 2 - 46, muted, 2.6) - 12;
  }

  footer(page, font, 4);
}

function page5Competition(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '06  ·  COMPETITION', 'Who AI recommends instead of you', H - 52);

  y = para(
    page,
    font,
    'Share of voice is the share of brand mentions across all successful answers (your brand + observed competitors). HubSpot is the gravitational center of this category in LLM answers — not because of ads, but because models can retrieve comparison copy, docs, and reviews.',
    M,
    y,
    9,
    W - M * 2,
    muted,
    3,
  );
  y -= 18;

  const sov = [
    ['HubSpot', '18', '31%', 'false'],
    ['Northline Analytics', '16', '28%', 'true'],
    ['Salesforce', '13', '22%', 'false'],
    ['Pipedrive', '7', '12%', 'false'],
    ['Zoho', '4', '7%', 'false'],
  ];
  page.drawText('Share of voice in 22 answers', { x: M, y, size: 11, font: bold, color: ink });
  y -= 18;
  page.drawRectangle({ x: M - 6, y: y - 6, width: W - M * 2 + 12, height: 20, color: navy });
  page.drawText('Brand', { x: M, y, size: 8, font: bold, color: white });
  page.drawText('Mentions', { x: M + 220, y, size: 8, font: bold, color: white });
  page.drawText('Share', { x: M + 300, y, size: 8, font: bold, color: white });
  page.drawText('Bar', { x: M + 360, y, size: 8, font: bold, color: white });
  y -= 24;
  sov.forEach((row, i) => {
    const isYou = row[3] === 'true';
    const share = parseInt(row[2], 10);
    if (i % 2 === 0) page.drawRectangle({ x: M - 6, y: y - 8, width: W - M * 2 + 12, height: 20, color: soft });
    page.drawText(isYou ? `${row[0]}  (you)` : row[0], {
      x: M,
      y,
      size: 9,
      font: isYou ? bold : font,
      color: ink,
    });
    page.drawText(row[1], { x: M + 220, y, size: 9, font, color: ink });
    page.drawText(row[2], { x: M + 300, y, size: 9, font: bold, color: ink });
    page.drawRectangle({
      x: M + 360,
      y: y - 2,
      width: Math.max(8, share * 3.2),
      height: 8,
      color: isYou ? gold : rgb(0.55, 0.58, 0.62),
    });
    y -= 20;
  });

  y -= 16;
  page.drawText('Where they beat you', { x: M, y, size: 11, font: bold, color: ink });
  y -= 14;
  const gaps: [string, string, string][] = [
    [
      'Default recommendation',
      'HubSpot named first in 11 answers',
      'You are a peer on ChatGPT, an afterthought elsewhere.',
    ],
    [
      'Citation inventory',
      'G2, HubSpot Academy, Salesforce Help',
      'Models quote competitor domains. Yours almost never.',
    ],
    [
      'Comparison ownership',
      '“HubSpot vs Salesforce” pages exist',
      'No Northline vs anyone. Assistants cannot place you in a pairwise choice.',
    ],
    [
      'Co-occurrence',
      'Northline + HubSpot together 6×',
      'When you appear, it is usually as an alternative — useful, but you are not the hub.',
    ],
  ];
  for (const [t, ev, impl] of gaps) {
    page.drawText(t, { x: M, y, size: 9, font: bold, color: ink });
    page.drawText(ev, { x: M + 168, y, size: 8, font, color: muted });
    y = para(page, font, impl, M, y - 14, 8, W - M * 2, muted, 2.6) - 10;
  }

  y -= 6;
  page.drawRectangle({ x: M, y: y - 70, width: W - M * 2, height: 76, color: navy });
  page.drawText('Competitive read', { x: M + 14, y: y - 16, size: 9, font: bold, color: gold });
  para(
    page,
    font,
    'You are close on raw mention count (16 vs HubSpot’s 18) and far on influence. Mentions without first-position and without citations do not convert AI answers into pipeline. Closing the gap means giving models the same retrieveable proof HubSpot already has — not matching their ad spend.',
    M + 14,
    y - 34,
    8.5,
    W - M * 2 - 28,
    rgb(0.85, 0.86, 0.88),
    3,
  );

  footer(page, font, 5);
}

function page6Better(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(page, bold, font, '07  ·  EXPLORE HOW TO DO IT BETTER', 'Highest-leverage moves', H - 52);

  y = para(
    page,
    font,
    'Three priorities surfaced from this analysis. Full playbooks, timelines, and per-platform tactics are available on a strategy call — not in this report.',
    M,
    y,
    9,
    W - M * 2,
    muted,
    3,
  );
  y -= 12;

  const actions: [string, string, string][] = [
    [
      '1',
      'Publish comparison pages',
      'Northline vs HubSpot and vs Salesforce — the missing retrieval target for shortlist and “vs” prompts.',
    ],
    [
      '2',
      'Add extractable FAQ + schema',
      'Eight buyer questions on-site so every LLM can quote the same facts ChatGPT already uses.',
    ],
    [
      '3',
      'Build citable third-party proof',
      'G2 profile, quantified customer stories, methodology page — what Perplexity cites for competitors.',
    ],
  ];

  for (const [n, title, body] of actions) {
    page.drawCircle({ x: M + 8, y: y + 2, size: 8, color: navy });
    page.drawText(n, { x: M + 5.5, y: y - 1, size: 8, font: bold, color: white });
    page.drawText(title, { x: M + 24, y, size: 10, font: bold, color: ink });
    y = para(page, font, body, M + 24, y - 16, 8.5, W - M * 2 - 24, muted, 2.8) - 14;
  }

  y -= 8;
  page.drawRectangle({ x: M, y: y - 100, width: W - M * 2, height: 104, color: navy });
  page.drawText('Final takeaway', { x: M + 14, y: y - 16, size: 9, font: bold, color: gold });
  para(
    page,
    font,
    'Northline is real to ChatGPT and almost invisible to Copilot and Grok. Fix retrieval — comparisons, FAQ, citable proof — then re-test. The next page has a one-line read per LLM; detailed strategy is on the call.',
    M + 14,
    y - 34,
    8.5,
    W - M * 2 - 28,
    rgb(0.88, 0.89, 0.9),
    3,
  );
  page.drawText('rohit@buddyads.agency', {
    x: M + 14,
    y: y - 88,
    size: 8,
    font,
    color: gold,
  });

  footer(page, font, 6);
}

function page7LlmStrategy(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
  const page = doc.addPage([W, H]);
  paint(page);
  let y = heading(
    page,
    bold,
    font,
    '08  ·  STRATEGY BY LLM',
    'One read per assistant — full playbooks on a strategy call',
    H - 52,
  );

  y = para(
    page,
    font,
    'Each LLM needs a different lever. This page is intentionally brief. Connect with us for a tailored strategy call to get the full roadmap per platform.',
    M,
    y,
    9,
    W - M * 2,
    muted,
    3,
  );
  y -= 14;

  const strategies: [string, string, string][] = [
    [
      'ChatGPT',
      'Protect & extend',
      'You already win here. Keep entity consistency and add citable proof so position #1 becomes default, not occasional.',
    ],
    [
      'Claude',
      'Convert mentions to citations',
      'Claude describes you well but rarely links. Add FAQ schema and a public methodology page it can quote.',
    ],
    [
      'Perplexity',
      'Win the citation war',
      'Perplexity cites competitors’ G2 and docs. Match that proof layer or you stay mentioned without traffic.',
    ],
    [
      'Gemini',
      'Enter the shortlist',
      'Gemini defaults to Tableau/Power BI. Comparison pages and third-party reviews are the unlock.',
    ],
    [
      'Copilot',
      'Basic retrieval fix',
      'Copilot barely knows you exist. Repeat the same entity strings across title, H1, schema, and About.',
    ],
    [
      'Grok',
      'Category insertion',
      'Grok answers from enterprise BI lists. You need “mid-market alternative” content in places Grok indexes.',
    ],
  ];

  strategies.forEach(([llm, tag, note], i) => {
    if (i % 2 === 0) {
      page.drawRectangle({ x: M - 6, y: y - 52, width: W - M * 2 + 12, height: 56, color: soft });
    }
    page.drawText(llm, { x: M, y: y - 4, size: 10, font: bold, color: ink });
    page.drawRectangle({ x: M + 108, y: y - 10, width: 108, height: 14, color: navy });
    page.drawText(tag, { x: M + 114, y: y - 7, size: 7, font: bold, color: white });
    y = para(page, font, note, M, y - 22, 8.5, W - M * 2, muted, 2.6) - 16;
  });

  y -= 10;
  page.drawRectangle({ x: M, y: y - 118, width: W - M * 2, height: 122, color: navy });
  page.drawText('Want the full strategy?', {
    x: M + 16,
    y: y - 20,
    size: 12,
    font: bold,
    color: white,
  });
  para(
    page,
    font,
    'This report shows where you stand. A strategy call covers the how: exact pages to ship, prompts to re-test, citation targets per LLM, and a 30/60/90-day plan built for your category.',
    M + 16,
    y - 40,
    9,
    W - M * 2 - 32,
    rgb(0.82, 0.84, 0.86),
    3.2,
  );
  page.drawRectangle({ x: M + 16, y: y - 88, width: 200, height: 28, color: gold });
  page.drawText('Book a strategy call', {
    x: M + 28,
    y: y - 80,
    size: 10,
    font: bold,
    color: navy,
  });
  page.drawText('buddyads.agency/contact  ·  rohit@buddyads.agency', {
    x: M + 16,
    y: y - 108,
    size: 8,
    font,
    color: rgb(0.7, 0.72, 0.76),
  });

  footer(page, font, 7);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
