import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { SpacesModule } from '../spaces/spaces.module';
import { ConnectionsModule } from './connections/connections.module';
import { LinksController } from './links/links.controller';
import { LinksService } from './links/links.service';
import { PullService } from './pull/pull.service';
import { PushService } from './push/push.service';
import { SyncQueueModule } from './queue/sync-queue.module';
import { SyncController } from './sync.controller';

@Module({
  imports: [ConnectionsModule, RealtimeModule, SpacesModule, SyncQueueModule],
  controllers: [LinksController, SyncController],
  providers: [LinksService, PullService, PushService],
  exports: [PullService, PushService, ConnectionsModule],
})
export class SyncModule {}
