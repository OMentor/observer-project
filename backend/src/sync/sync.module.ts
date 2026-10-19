import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { SpacesModule } from '../spaces/spaces.module';
import { ConnectionsModule } from './connections/connections.module';
import { LinksController } from './links/links.controller';
import { LinksService } from './links/links.service';
import { PullService } from './pull/pull.service';
import { SyncQueueService } from './queue/sync-queue.service';
import { SyncController } from './sync.controller';

@Module({
  imports: [ConnectionsModule, RealtimeModule, SpacesModule],
  controllers: [LinksController, SyncController],
  providers: [LinksService, PullService, SyncQueueService],
  exports: [PullService, ConnectionsModule],
})
export class SyncModule {}
