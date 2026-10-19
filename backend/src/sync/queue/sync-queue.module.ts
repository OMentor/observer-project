import { Module } from '@nestjs/common';
import { SyncQueueService } from './sync-queue.service';

/**
 * Изолированный модуль очереди, чтобы и `SyncModule`, и `EventsModule` могли
 * ставить задачи, не импортируя друг друга (без циклических зависимостей).
 */
@Module({
  providers: [SyncQueueService],
  exports: [SyncQueueService],
})
export class SyncQueueModule {}
