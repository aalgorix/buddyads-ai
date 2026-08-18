import type { IntelligenceReport } from './report-types';
import { renderStructuredReportPdf } from './report-pdf-render';

export async function renderReportPdf(
  report: IntelligenceReport,
  customerName: string,
): Promise<Buffer> {
  return renderStructuredReportPdf(report, customerName);
}
