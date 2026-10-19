import { Worker } from 'bullmq';
import IORedis from 'ioredis';

export const SYNC_QUEUE = 'sync';

export interface SyncJobData {
  connectionId?: string;
  sourceMapId?: string;
}

/**
 * Заглушка воркера синхронизации (Фаза 1).
 *
 * Реальный pull/push появится в Фазах 2/3. Пока воркер только логирует
 * полученные задания, подтверждая работоспособность связки BullMQ + Redis.
 *
 * Примечание: используется чистый BullMQ (без `@nestjs/bullmq`), чтобы не
 * добавлять новую зависимость на этом этапе.
 */
export function createSyncWorker(redisUrl: string): Worker<SyncJobData> {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  const worker = new Worker<SyncJobData>(
    SYNC_QUEUE,
    async (job) => {
      console.log(`[sync] получено задание ${job.id} (${job.name})`, job.data);
    },
    { connection },
  );

  worker.on('failed', (job, error) => {
    console.error(`[sync] задание ${job?.id} упало:`, error.message);
  });

  return worker;
}
