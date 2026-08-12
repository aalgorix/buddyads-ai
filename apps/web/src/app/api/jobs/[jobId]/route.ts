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
    include: { report: { select: { token: true, overall: true } } },
  });
  if (!job) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progressStep: job.progressStep,
    error: job.error,
    reportToken: job.report?.token ?? null,
    overall: job.report?.overall ?? null,
  });
}
