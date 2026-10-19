import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { SYNC_QUEUE, SyncJobData } from '../sync.constants';

/** Ставит задачи синхронизации в очередь BullMQ (используется API). */
@Injectable()
export class SyncQueueService implements OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly queue: Queue<SyncJobData>;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.connection = new IORedis(url, { maxRetriesPerRequest: null });
    this.queue = new Queue<SyncJobData>(SYNC_QUEUE, {
      connection: this.connection,
    });
  }

  async enqueue(data: SyncJobData): Promise<void> {
    await this.queue.add('sync', data, {
      removeOnComplete: true,
      removeOnFail: 100,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    this.connection.disconnect();
  }
}
