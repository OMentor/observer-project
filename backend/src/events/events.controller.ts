import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  createEventSchema,
  ListEventsDto,
  listEventsSchema,
  UpdateEventDto,
  updateEventSchema,
} from './events.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

@ApiTags('Events')
@ApiBearerAuth()
@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Post('sources/:sourceId/events')
  create(
    @CurrentUser() user: AuthUser,
    @Param('sourceId') sourceId: string,
    @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventDto,
  ) {
    return this.events.create(user.id, sourceId, dto);
  }

  @Get('sources/:sourceId/events')
  findAll(
    @CurrentUser() user: AuthUser,
    @Param('sourceId') sourceId: string,
    @Query(new ZodValidationPipe(listEventsSchema)) query: ListEventsDto,
  ) {
    return this.events.findAll(user.id, sourceId, query);
  }

  @Get('events/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.findOne(user.id, id);
  }

  @Get('events/:id/history')
  history(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.history(user.id, id);
  }

  @Patch('events/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEventSchema)) dto: UpdateEventDto,
  ) {
    return this.events.update(user.id, id, dto);
  }

  @HttpCode(200)
  @Delete('events/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.remove(user.id, id);
  }
}
