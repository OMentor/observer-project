import { Module } from '@nestjs/common';
import { SpacesModule } from '../spaces/spaces.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';

@Module({
  imports: [SpacesModule, RealtimeModule],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
