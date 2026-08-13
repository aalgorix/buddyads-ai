import path from 'node:path';
import { config } from 'dotenv';
import { prisma } from '@buddyads/db';
import { env } from './env';
import { runVisibilityAgent } from './agent/run';

config({ path: path.resolve(__dirname, '../../../.env') });

function log(...args: unknown[]) {
  const line = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
  process.stdout.write(`${line}\n`);
}

function logErr(...args: unknown[]) {
  const line = args.map((a) => (a instanceof Error ? a.stack || a.message : String(a))).join(' ');
  process.stderr.write(`${line}\n`);
}

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
  log(`[buddyads-worker] polling every ${POLL_MS}ms`);
  let idleTicks = 0;
  while (!stopping) {
    try {
      const jobId = await claimNextJob();
      if (jobId) {
        idleTicks = 0;
        log(`[buddyads-worker] running agent for ${jobId}`);
        await runVisibilityAgent(jobId);
        log(`[buddyads-worker] completed ${jobId}`);
      } else {
        idleTicks += 1;
        if (idleTicks === 1 || idleTicks % 12 === 0) {
          log(`[buddyads-worker] idle (no PENDING jobs) tick=${idleTicks}`);
        }
      }
    } catch (err) {
      logErr('[buddyads-worker] error', err);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

log('[buddyads-worker] starting single Visibility Agent…');
log(`[buddyads-worker] node=${process.version} cwd=${process.cwd()}`);

loop().catch((err) => {
  logErr('[buddyads-worker] fatal', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  stopping = true;
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopping = true;
  process.exit(0);
});
