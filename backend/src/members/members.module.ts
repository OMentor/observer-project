import { Module } from '@nestjs/common';
import { SpacesModule } from '../spaces/spaces.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [SpacesModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
