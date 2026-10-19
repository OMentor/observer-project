import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { SYNC_QUEUE, SyncJobData } from '../sync/sync.constants';

export type SyncJobHandler = (data: SyncJobData) => Promise<void>;

/**
 * Воркер синхронизации на чистом BullMQ (без `@nestjs/bullmq`).
 * Обработчик передаётся из `worker/main.ts` (DI-контейнер Nest доступен через
 * `app.get(...)`).
 */
export function createSyncWorker(
  redisUrl: string,
  handler: SyncJobHandler,
): Worker<SyncJobData> {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  const worker = new Worker<SyncJobData>(
    SYNC_QUEUE,
    async (job) => {
      await handler(job.data);
    },
    { connection },
  );

  worker.on('completed', (job) => {
    console.log(`[sync] задание ${job.id} завершено`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[sync] задание ${job?.id} упало:`, error.message);
  });

  return worker;
}
