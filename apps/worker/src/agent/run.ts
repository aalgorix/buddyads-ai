import { randomBytes } from 'node:crypto';
import { prisma } from '@buddyads/db';
import { getBookCallUrl } from '../env';
import { runVisibilityPipeline, type Intake } from '../pipeline/run';
import { buildReport } from '../tools/score';
import { saveReportPdf } from '../tools/pdf';
import { reportUrlForToken, sendReportEmail } from '../tools/email';

type Trace = { step: number; thought?: string; action: string; detail?: string };

function parseIntake(raw: string | null | undefined): Intake | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Intake;
  } catch {
    return null;
  }
}

/**
 * Staged visibility pipeline:
 * crawl → technical → AEO → GEO → prompts → multi-provider research → parse → evidence → graph → report
 */
export async function runVisibilityAgent(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { customer: true },
  });
  if (!job) throw new Error(`Job not found: ${jobId}`);

  const intake = parseIntake(job.intake);
  const trace: Trace[] = [];

  const updateStep = async (progressStep: string, detail?: string) => {
    trace.push({ step: trace.length + 1, action: progressStep, detail });
    await prisma.job.update({
      where: { id: jobId },
      data: { progressStep, agentTrace: JSON.stringify(trace) },
    });
  };

  try {
    const pipeline = await runVisibilityPipeline({
      websiteUrl: job.websiteUrl,
      brandHint: job.customer.company || job.customer.name,
      intake,
      onStep: updateStep,
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { pipelineJson: JSON.stringify(pipeline.artifacts) },
    });

    const brand =
      pipeline.crawl.brandGuess ||
      intake?.companyName ||
      job.customer.company ||
      job.customer.name ||
      job.websiteUrl;

    await updateStep('score');
    const report = await buildReport({
      analysisId: jobId,
      brandName: brand,
      websiteUrl: job.websiteUrl,
      crawl: pipeline.crawl,
      research: pipeline.research,
      agentNotes: pipeline.notes.join(' '),
      competitors: intake?.competitors,
      intake,
      engineScores: {
        aeo: pipeline.artifacts.aeoScore,
        geo: pipeline.artifacts.geoScore,
        technical: pipeline.artifacts.technicalScore,
      },
    });

    const token = randomBytes(18).toString('hex');
    let pdfPath: string | null = null;
    try {
      pdfPath = await saveReportPdf(jobId, report, job.customer.name);
      trace.push({ step: trace.length + 1, action: 'pdf', detail: pdfPath });
    } catch (err) {
      trace.push({
        step: trace.length + 1,
        action: 'pdf',
        detail: err instanceof Error ? err.message : 'pdf failed',
      });
    }

    await prisma.report.upsert({
      where: { jobId },
      create: {
        jobId,
        token,
        brandName: report.brandName,
        overall: report.overall,
        aeo: report.aeo,
        geo: report.geo,
        llmReady: report.llmReady,
        grade: '', // column retained; letter grades are no longer produced
        summary: report.summary,
        payload: JSON.stringify(report),
        pdfPath,
      },
      update: {
        token,
        brandName: report.brandName,
        overall: report.overall,
        aeo: report.aeo,
        geo: report.geo,
        llmReady: report.llmReady,
        grade: '', // column retained; letter grades are no longer produced
        summary: report.summary,
        payload: JSON.stringify(report),
        pdfPath,
      },
    });

    const url = reportUrlForToken(token);
    const email = await sendReportEmail({
      to: job.customer.email,
      name: job.customer.name,
      brandName: report.brandName,
      reportUrl: url,
      overall: report.overall,
      aeo: report.aeo,
      geo: report.geo,
      bookCallUrl: getBookCallUrl(),
    });

    await prisma.emailLog.create({
      data: {
        jobId,
        status: email.status,
        providerId: email.id || null,
        error: email.error || null,
      },
    });

    trace.push({
      step: trace.length + 1,
      action: 'email',
      detail: `${email.status}${email.error ? `: ${email.error}` : ''}`,
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progressStep: 'done',
        completedAt: new Date(),
        agentTrace: JSON.stringify(trace),
        pipelineJson: JSON.stringify(pipeline.artifacts),
        error:
          email.status === 'SENT'
            ? null
            : email.status === 'SKIPPED'
              ? `Report ready (email skipped: ${email.error})`
              : `Report ready (email failed: ${email.error})`,
      },
    });
  } catch (err) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        progressStep: 'failed',
        error: err instanceof Error ? err.message : 'Agent failed',
        completedAt: new Date(),
        agentTrace: JSON.stringify(trace),
      },
    });
    throw err;
  }
}
