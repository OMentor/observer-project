import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { SpacesModule } from '../spaces/spaces.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SyncQueueModule } from '../sync/queue/sync-queue.module';

@Module({
  imports: [SpacesModule, RealtimeModule, SyncQueueModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
