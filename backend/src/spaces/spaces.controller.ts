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
import { SpacesService } from './spaces.service';
import {
  CreateSpaceDto,
  createSpaceSchema,
  UpdateSpaceDto,
  updateSpaceSchema,
} from './spaces.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

@ApiTags('Spaces')
@ApiBearerAuth()
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createSpaceSchema)) dto: CreateSpaceDto,
  ) {
    return this.spaces.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.spaces.findAllForUser(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.spaces.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSpaceSchema)) dto: UpdateSpaceDto,
  ) {
    return this.spaces.update(user.id, id, dto);
  }

  @HttpCode(200)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.spaces.remove(user.id, id);
  }
}
