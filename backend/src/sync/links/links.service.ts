import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SpacesService } from '../../spaces/spaces.service';
import { PullService } from '../pull/pull.service';
import { LinkSourceDto } from './links.dto';

/**
 * Связывание источника «Плетения» с внешним календарём и первичный pull.
 */
@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
    private readonly pull: PullService,
  ) {}

  async link(userId: string, sourceId: string, dto: LinkSourceDto) {
    await this.resolveSourceWithAccess(userId, sourceId);

    const connection = await this.prisma.externalConnection.findFirst({
      where: { id: dto.connectionId, user_id: userId },
    });
    if (!connection) {
      throw new NotFoundException('Подключение не найдено');
    }

    const sourceMap = await this.prisma.sourceExternalMap.findFirst({
      where: { source_id: sourceId },
    });
    if (sourceMap) {
      throw new ConflictException('Источник уже связан с календарём');
    }

    const calendarMap = await this.prisma.sourceExternalMap.findFirst({
      where: {
        external_connection_id: connection.id,
        external_calendar_id: dto.externalCalendarId,
      },
    });
    if (calendarMap) {
      throw new ConflictException('Этот календарь уже связан с другим источником');
    }

    const map = await this.prisma.sourceExternalMap.create({
      data: {
        source_id: sourceId,
        external_connection_id: connection.id,
        external_calendar_id: dto.externalCalendarId,
        external_calendar_name: dto.externalCalendarName ?? null,
        sync_direction: dto.syncDirection ?? 'both',
      },
    });

    // Первичный pull синхронно, чтобы пользователь сразу увидел события.
    const stats = await this.pull.pullSourceMap(map.id);

    return {
      id: map.id,
      source_id: map.source_id,
      external_connection_id: map.external_connection_id,
      external_calendar_id: map.external_calendar_id,
      external_calendar_name: map.external_calendar_name,
      sync_direction: map.sync_direction,
      stats,
    };
  }

  async unlink(userId: string, sourceId: string) {
    await this.resolveSourceWithAccess(userId, sourceId);

    const map = await this.prisma.sourceExternalMap.findFirst({
      where: { source_id: sourceId },
    });
    if (!map) {
      throw new NotFoundException('Связь с календарём не найдена');
    }
    const connection = await this.prisma.externalConnection.findFirst({
      where: { id: map.external_connection_id, user_id: userId },
    });
    if (!connection) {
      throw new NotFoundException('Связь с календарём не найдена');
    }

    await this.prisma.sourceExternalMap.delete({ where: { id: map.id } });
    return { success: true };
  }

  private async resolveSourceWithAccess(userId: string, sourceId: string) {
    const source = await this.prisma.source.findFirst({
      where: { id: sourceId, deleted_at: null },
      select: { id: true, space_id: true },
    });
    if (!source) {
      throw new NotFoundException('Источник не найден');
    }
    const access = await this.spaces.getAccess(userId, source.space_id);
    if (access.preset !== 'FULL') {
      throw new ForbiddenException('Недостаточно прав для связывания источника');
    }
    return source;
  }
}
