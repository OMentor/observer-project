import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto, createConnectionSchema } from './connections.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync/connections')
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createConnectionSchema))
    dto: CreateConnectionDto,
  ) {
    return this.connections.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.connections.findAll(user.id);
  }

  @HttpCode(200)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.connections.remove(user.id, id);
  }
}
