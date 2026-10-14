import { Module } from '@nestjs/common';
import { SpacesModule } from '../spaces/spaces.module';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';

@Module({
  imports: [SpacesModule],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
