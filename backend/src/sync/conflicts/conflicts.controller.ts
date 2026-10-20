import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ConflictResolverService } from './conflict-resolver.service';
import {
  ListConflictsDto,
  listConflictsQuerySchema,
} from './dto/list-conflicts.query';
import {
  ResolveConflictDto,
  resolveConflictSchema,
} from './dto/resolve-conflict.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync/conflicts')
export class ConflictsController {
  constructor(private readonly resolver: ConflictResolverService) {}

  /** Список неразрешённых конфликтов пользователя. */
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listConflictsQuerySchema))
    query: ListConflictsDto,
  ) {
    return this.resolver.list(user.id, query);
  }

  /** Один конфликт с полными локальной и внешней версиями. */
  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.resolver.get(user.id, id);
  }

  /** Разрешает конфликт и возвращает обновлённое событие. */
  @Post(':id/resolve')
  @HttpCode(200)
  resolve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(resolveConflictSchema))
    dto: ResolveConflictDto,
  ) {
    return this.resolver.resolve(user.id, id, dto);
  }
}
