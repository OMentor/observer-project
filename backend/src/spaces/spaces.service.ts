import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Preset } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto, UpdateSpaceDto } from './spaces.dto';

export interface SpaceAccess {
  isOwner: boolean;
  preset: Preset;
}

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: {
        name: dto.name,
        owner_id: userId,
        members: {
          create: { user_id: userId, preset: 'FULL' },
        },
      },
      include: { sources: true },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.space.findMany({
      where: {
        deleted_at: null,
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId, revoked_at: null } } },
        ],
      },
      orderBy: { created_at: 'desc' },
      include: {
        sources: { where: { deleted_at: null }, orderBy: { created_at: 'asc' } },
      },
    });
  }

  async findOne(userId: string, spaceId: string) {
    await this.ensureMember(userId, spaceId);
    const space = await this.prisma.space.findFirst({
      where: { id: spaceId, deleted_at: null },
      include: {
        sources: { where: { deleted_at: null }, orderBy: { created_at: 'asc' } },
      },
    });
    if (!space) {
      throw new NotFoundException('Пространство не найдено');
    }
    return space;
  }

  async update(userId: string, spaceId: string, dto: UpdateSpaceDto) {
    await this.ensureOwner(userId, spaceId);
    return this.prisma.space.update({
      where: { id: spaceId },
      data: { name: dto.name },
    });
  }

  async remove(userId: string, spaceId: string) {
    await this.ensureOwner(userId, spaceId);
    await this.prisma.space.update({
      where: { id: spaceId },
      data: { deleted_at: new Date() },
    });
    return { success: true };
  }

  async ensureMember(userId: string, spaceId: string) {
    const space = await this.prisma.space.findFirst({
      where: { id: spaceId, deleted_at: null },
      select: { id: true, owner_id: true },
    });
    if (!space) {
      throw new NotFoundException('Пространство не найдено');
    }
    const member = await this.prisma.spaceMember.findFirst({
      where: { space_id: spaceId, user_id: userId, revoked_at: null },
    });
    if (!member && space.owner_id !== userId) {
      throw new ForbiddenException('Нет доступа к пространству');
    }
    return { space, member };
  }

  async getAccess(userId: string, spaceId: string): Promise<SpaceAccess> {
    const space = await this.prisma.space.findFirst({
      where: { id: spaceId, deleted_at: null },
      select: { owner_id: true },
    });
    if (!space) {
      throw new NotFoundException('Пространство не найдено');
    }
    if (space.owner_id === userId) {
      return { isOwner: true, preset: 'FULL' };
    }
    const member = await this.prisma.spaceMember.findFirst({
      where: { space_id: spaceId, user_id: userId, revoked_at: null },
      select: { preset: true },
    });
    if (!member) {
      throw new ForbiddenException('Нет доступа к пространству');
    }
    return { isOwner: false, preset: member.preset };
  }

  async ensureOwner(userId: string, spaceId: string) {
    const space = await this.prisma.space.findFirst({
      where: { id: spaceId, deleted_at: null },
      select: { owner_id: true },
    });
    if (!space) {
      throw new NotFoundException('Пространство не найдено');
    }
    if (space.owner_id !== userId) {
      throw new ForbiddenException('Действие доступно только владельцу');
    }
    return space;
  }
}
