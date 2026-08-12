import path from 'node:path';
import { config } from 'dotenv';
import { prisma } from '@buddyads/db';
import { env } from './env';
import { runVisibilityAgent } from './agent/run';

config({ path: path.resolve(__dirname, '../../../.env') });

const POLL_MS = Number(env('WORKER_POLL_MS', '5000')) || 5000;
let stopping = false;

async function claimNextJob(): Promise<string | null> {
  const next = await prisma.job.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!next) return null;

  const claimed = await prisma.job.updateMany({
    where: { id: next.id, status: 'PENDING' },
    data: {
      status: 'RUNNING',
      progressStep: 'claimed',
      startedAt: new Date(),
      error: null,
    },
  });
  if (claimed.count === 0) return null;
  return next.id;
}

async function loop() {
  console.log(`[buddyads-worker] polling every ${POLL_MS}ms`);
  while (!stopping) {
    try {
      const jobId = await claimNextJob();
      if (jobId) {
        console.log('[buddyads-worker] running agent for', jobId);
        await runVisibilityAgent(jobId);
        console.log('[buddyads-worker] completed', jobId);
      }
    } catch (err) {
      console.error('[buddyads-worker] error', err);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

console.log('[buddyads-worker] starting single Visibility Agent…');
void loop();

process.on('SIGINT', () => {
  stopping = true;
  process.exit(0);
});
