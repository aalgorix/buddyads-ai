import type { IntelligenceReport } from './report-types';
import { enrichReportDerived } from './report-derived';
import { assertReportCollectionCounts, containsRefusalLeak } from './report-integrity';
import { renderReportPdfDocument } from '@buddyads/report-pdf';

export async function renderStructuredReportPdf(
  report: IntelligenceReport,
  customerName: string,
): Promise<Buffer> {
  const r = enrichReportDerived(report);
  assertReportCollectionCounts(r);
  if (containsRefusalLeak(`${r.summary}\n${r.competitorInsights}\n${(r.competitors || []).map((c) => c.name).join('\n')}`)) {
    process.stderr.write('[report-integrity] refusal string leaked into PDF payload\n');
  }
  return renderReportPdfDocument(r, customerName);
}
