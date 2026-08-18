import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ReportPayload } from '../types/report';
import { renderStructuredReportPdf } from './report-pdf-render';

export async function renderReportPdf(report: ReportPayload, customerName: string): Promise<Buffer> {
  return renderStructuredReportPdf(report, customerName);
}

export async function saveReportPdf(
  jobId: string,
  report: ReportPayload,
  customerName: string,
): Promise<string> {
  const dir = path.resolve(__dirname, '../../../../storage/pdfs');
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${jobId}.pdf`);
  const buf = await renderStructuredReportPdf(report, customerName);
  await writeFile(filePath, buf);
  return filePath;
}
