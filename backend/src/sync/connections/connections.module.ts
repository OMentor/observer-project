import { Module } from '@nestjs/common';
import { ProviderFactory } from '../providers/provider.factory';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';

@Module({
  controllers: [ConnectionsController],
  providers: [ConnectionsService, ProviderFactory],
  exports: [ConnectionsService, ProviderFactory],
})
export class ConnectionsModule {}
