import { NextResponse } from 'next/server';
import { prisma } from '@buddyads/db';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      report: {
        select: { token: true, overall: true, aeo: true, geo: true, pdfPath: true },
      },
    },
  });
  if (!job) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const emailLog = await prisma.emailLog.findFirst({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
  });

  const reportUrl = job.report?.token ? `/report/${job.report.token}` : null;
  const pdfUrl = job.report?.token && job.report.pdfPath ? `/api/reports/${job.report.token}/pdf` : null;

  let emailStatus = emailLog?.status || null;
  if (!emailStatus && job.status === 'COMPLETED' && job.error?.includes('email skipped')) {
    emailStatus = 'SKIPPED';
  } else if (!emailStatus && job.status === 'COMPLETED' && job.error?.includes('email failed')) {
    emailStatus = 'FAILED';
  } else if (!emailStatus && job.status === 'COMPLETED' && !job.error) {
    emailStatus = 'SENT';
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progressStep: job.progressStep,
    error: job.error,
    reportToken: job.report?.token ?? null,
    reportUrl,
    pdfUrl,
    emailStatus,
    overall: job.report?.overall ?? null,
    scores: job.report
      ? { overall: job.report.overall, aeo: job.report.aeo, geo: job.report.geo }
      : null,
  });
}
