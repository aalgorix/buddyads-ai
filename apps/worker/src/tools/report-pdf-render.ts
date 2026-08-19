import type { ReportPayload } from '../types/report';
import { enrichReportPayload } from './report-derived';
import { assertReportCollectionCounts, containsRefusalLeak } from './report-integrity';
import { renderReportPdfDocument } from '@buddyads/report-pdf';

export async function renderStructuredReportPdf(
  report: ReportPayload,
  customerName: string,
): Promise<Buffer> {
  const r = enrichReportPayload(report);
  assertReportCollectionCounts(r);
  if (containsRefusalLeak(`${r.summary}\n${r.competitorInsights}\n${(r.competitors || []).map((c) => c.name).join('\n')}`)) {
    process.stderr.write('[report-integrity] refusal string leaked into PDF payload\n');
  }
  return renderReportPdfDocument(r, customerName);
}
