import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { CreateSourceDto, UpdateSourceDto } from './sources.dto';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
  ) {}

  async create(userId: string, spaceId: string, dto: CreateSourceDto) {
    await this.spaces.ensureMember(userId, spaceId);
    return this.prisma.source.create({
      data: {
        space_id: spaceId,
        owner_id: userId,
        name: dto.name,
        color: dto.color ?? '#5B5FEF',
        visibility: dto.visibility ?? 'SHARED',
      },
    });
  }

  async findAll(userId: string, spaceId: string) {
    const { member, space } = await this.spaces.ensureMember(userId, spaceId);
    const isFull = space.owner_id === userId || member?.preset === 'FULL';
    return this.prisma.source.findMany({
      where: {
        space_id: spaceId,
        deleted_at: null,
        ...(isFull
          ? {}
          : { OR: [{ visibility: 'SHARED' }, { owner_id: userId }] }),
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(userId: string, sourceId: string) {
    const source = await this.load(userId, sourceId);
    return source;
  }

  async update(userId: string, sourceId: string, dto: UpdateSourceDto) {
    const source = await this.load(userId, sourceId);
    this.assertCanManage(userId, source);
    return this.prisma.source.update({
      where: { id: sourceId },
      data: {
        name: dto.name,
        color: dto.color,
        visibility: dto.visibility,
      },
    });
  }

  async remove(userId: string, sourceId: string) {
    const source = await this.load(userId, sourceId);
    this.assertCanManage(userId, source);
    await this.prisma.source.update({
      where: { id: sourceId },
      data: { deleted_at: new Date() },
    });
    return { success: true };
  }

  private async load(userId: string, sourceId: string) {
    const source = await this.prisma.source.findFirst({
      where: { id: sourceId, deleted_at: null },
    });
    if (!source) {
      throw new NotFoundException('Источник не найден');
    }
    await this.spaces.ensureMember(userId, source.space_id);
    return source;
  }

  private assertCanManage(
    userId: string,
    source: { owner_id: string | null; space_id: string },
  ) {
    if (source.owner_id && source.owner_id !== userId) {
      throw new ForbiddenException('Нет прав на изменение источника');
    }
  }
}
