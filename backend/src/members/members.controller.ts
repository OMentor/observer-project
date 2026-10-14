import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';
import {
  UpdateMemberDto,
  updateMemberSchema,
} from './members.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RequirePreset } from '../common/require-preset.decorator';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

@ApiTags('Members')
@ApiBearerAuth()
@Controller()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get('spaces/:id/members')
  @RequirePreset(['FULL', 'OWN', 'BUSY', 'READ'], 'space')
  list(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.members.list(user.id, id);
  }

  @Patch('members/:id')
  @RequirePreset(['FULL'], 'member')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMemberSchema)) dto: UpdateMemberDto,
  ) {
    return this.members.update(user.id, id, dto);
  }

  @HttpCode(200)
  @Delete('members/:id')
  @RequirePreset(['FULL'], 'member')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.members.remove(user.id, id);
  }
}
