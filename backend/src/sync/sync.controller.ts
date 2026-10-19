import {
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { SyncQueueService } from './queue/sync-queue.service';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync/connections')
export class SyncController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: SyncQueueService,
  ) {}

  /** Ставит в очередь синхронизацию всех связей подключения. */
  @Post(':id/force')
  @HttpCode(202)
  async force(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const connection = await this.prisma.externalConnection.findFirst({
      where: { id, user_id: user.id },
      select: { id: true },
    });
    if (!connection) {
      throw new NotFoundException('Подключение не найдено');
    }
    const maps = await this.prisma.sourceExternalMap.findMany({
      where: { external_connection_id: id },
      select: { id: true },
    });
    for (const map of maps) {
      await this.queue.enqueue({ sourceMapId: map.id });
    }
    return { queued: maps.length };
  }
}
