import { Module } from '@nestjs/common';
import { ConnectionsModule } from './connections/connections.module';

@Module({
  imports: [ConnectionsModule],
  exports: [ConnectionsModule],
})
export class SyncModule {}
