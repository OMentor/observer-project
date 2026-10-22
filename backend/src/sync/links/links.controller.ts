import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { RequirePreset } from '../../common/require-preset.decorator';
import { LinksService } from './links.service';
import { LinkSourceDto, linkSourceSchema } from './links.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sources')
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Post(':id/link')
  @RequirePreset(['FULL'], 'source')
  link(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(linkSourceSchema)) dto: LinkSourceDto,
  ) {
    return this.links.link(user.id, id, dto);
  }

  @HttpCode(200)
  @Delete(':id/link')
  @RequirePreset(['FULL'], 'source')
  unlink(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.links.unlink(user.id, id);
  }
}
