import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { UpdateMemberDto } from './members.dto';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
  ) {}

  async list(userId: string, spaceId: string) {
    await this.spaces.ensureMember(userId, spaceId);
    return this.prisma.spaceMember.findMany({
      where: { space_id: spaceId, revoked_at: null },
      orderBy: { joined_at: 'asc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async update(userId: string, memberId: string, dto: UpdateMemberDto) {
    const member = await this.loadForManage(userId, memberId);
    return this.prisma.spaceMember.update({
      where: { id: member.id },
      data: { preset: dto.preset },
    });
  }

  async remove(userId: string, memberId: string) {
    const member = await this.loadForManage(userId, memberId);
    await this.prisma.spaceMember.update({
      where: { id: member.id },
      data: { revoked_at: new Date() },
    });
    return { success: true };
  }

  private async loadForManage(userId: string, memberId: string) {
    const member = await this.prisma.spaceMember.findUnique({
      where: { id: memberId },
      select: { id: true, space_id: true, user_id: true, revoked_at: true },
    });
    if (!member) {
      throw new NotFoundException('Участник не найден');
    }
    const access = await this.spaces.getAccess(userId, member.space_id);
    if (access.preset !== 'FULL') {
      throw new ForbiddenException('Требуется полный доступ');
    }
    const space = await this.prisma.space.findFirst({
      where: { id: member.space_id },
      select: { owner_id: true },
    });
    if (space?.owner_id === member.user_id) {
      throw new ForbiddenException('Нельзя изменить владельца пространства');
    }
    return member;
  }
}
