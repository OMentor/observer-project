import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { encryptCredential } from '../crypto';
import { ProviderFactory } from '../providers/provider.factory';
import { CreateConnectionDto } from './connections.dto';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: ProviderFactory,
    private readonly config: ConfigService,
  ) {}

  /**
   * Проверяет реквизиты через `listCalendars`, затем сохраняет подключение
   * с зашифрованным паролем. Возвращает подключение и список календарей.
   */
  async create(userId: string, dto: CreateConnectionDto) {
    const provider = this.factory.createWithCredentials(
      dto.provider,
      dto.url,
      dto.username,
      dto.password,
    );
    const calendars = await provider.listCalendars();

    const passwordEnc = encryptCredential(
      dto.password,
      this.config.get<string>('ENCRYPTION_KEY'),
    );

    const connection = await this.prisma.externalConnection.create({
      data: {
        user_id: userId,
        provider: dto.provider,
        caldav_url: dto.url,
        caldav_username: dto.username,
        caldav_password_enc: passwordEnc,
      },
    });

    return {
      id: connection.id,
      provider: connection.provider,
      url: connection.caldav_url,
      username: connection.caldav_username,
      sync_status: connection.sync_status,
      calendars,
    };
  }

  /** Список подключений пользователя без секретов. */
  async findAll(userId: string) {
    const connections = await this.prisma.externalConnection.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    });
    return connections.map((connection) => ({
      id: connection.id,
      provider: connection.provider,
      url: connection.caldav_url,
      username: connection.caldav_username,
      sync_status: connection.sync_status,
      last_sync_at: connection.last_sync_at,
      last_error: connection.last_error,
    }));
  }

  /** Отключение: hard-delete подключения и связанных связей источников. */
  async remove(userId: string, id: string) {
    const connection = await this.prisma.externalConnection.findFirst({
      where: { id, user_id: userId },
    });
    if (!connection) {
      throw new NotFoundException('Подключение не найдено');
    }
    await this.prisma.$transaction([
      this.prisma.sourceExternalMap.deleteMany({
        where: { external_connection_id: id },
      }),
      this.prisma.externalConnection.delete({ where: { id } }),
    ]);
    return { success: true };
  }
}
