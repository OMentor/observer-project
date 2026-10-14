import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import {
  CreateSourceDto,
  createSourceSchema,
  UpdateSourceDto,
  updateSourceSchema,
} from './sources.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

@ApiTags('Sources')
@ApiBearerAuth()
@Controller()
export class SourcesController {
  constructor(private readonly sources: SourcesService) {}

  @Post('spaces/:spaceId/sources')
  create(
    @CurrentUser() user: AuthUser,
    @Param('spaceId') spaceId: string,
    @Body(new ZodValidationPipe(createSourceSchema)) dto: CreateSourceDto,
  ) {
    return this.sources.create(user.id, spaceId, dto);
  }

  @Get('spaces/:spaceId/sources')
  findAll(@CurrentUser() user: AuthUser, @Param('spaceId') spaceId: string) {
    return this.sources.findAll(user.id, spaceId);
  }

  @Get('sources/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sources.findOne(user.id, id);
  }

  @Patch('sources/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSourceSchema)) dto: UpdateSourceDto,
  ) {
    return this.sources.update(user.id, id, dto);
  }

  @HttpCode(200)
  @Delete('sources/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sources.remove(user.id, id);
  }
}
