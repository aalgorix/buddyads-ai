import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@buddyads/db';
import { ReportView } from '@/components/report/report-view';
import { normalizeReport } from '@/lib/normalize-report';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const report = await prisma.report.findUnique({
    where: { token },
    select: { brandName: true },
  });
  if (!report) return { title: 'Report' };
  return {
    title: `AI Visibility Intelligence Report — ${report.brandName}`,
    robots: { index: false, follow: false },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await prisma.report.findUnique({
    where: { token },
    include: { job: { select: { id: true, createdAt: true, completedAt: true } } },
  });
  if (!report) notFound();

  const intelligence = normalizeReport(report.payload, {
    brandName: report.brandName,
    overall: report.overall,
    aeo: report.aeo,
    geo: report.geo,
    llmReady: report.llmReady,
    grade: report.grade,
    summary: report.summary,
    token: report.token,
    analysisId: report.jobId,
    generatedAt: report.createdAt.toISOString(),
    pdfAvailable: Boolean(report.pdfPath),
  });

  if (report.job?.createdAt && intelligence.coverage) {
    intelligence.coverage.researchStartedAt = report.job.createdAt.toISOString();
    intelligence.coverage.researchEndedAt = (report.job.completedAt || report.createdAt).toISOString();
  }

  return <ReportView report={intelligence} />;
}
