import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './current-user.decorator';
import {
  PRESET_KEY,
  PresetRequirement,
  PresetResource,
} from './require-preset.decorator';

type AuthedRequest = Request & {
  user?: AuthUser;
  params: Record<string, string>;
  body: Record<string, unknown>;
};

@Injectable()
export class PresetGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PresetRequirement>(
      PRESET_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const user = request.user;
    if (!user?.id) {
      throw new ForbiddenException('Требуется авторизация');
    }

    const spaceId = await this.resolveSpaceId(requirement.resource, request);
    if (!spaceId) {
      throw new NotFoundException('Пространство не найдено');
    }

    const space = await this.prisma.space.findFirst({
      where: { id: spaceId, deleted_at: null },
      select: { owner_id: true },
    });
    if (!space) {
      throw new NotFoundException('Пространство не найдено');
    }
    if (space.owner_id === user.id) {
      return true;
    }

    const member = await this.prisma.spaceMember.findFirst({
      where: { space_id: spaceId, user_id: user.id, revoked_at: null },
      select: { preset: true },
    });
    if (!member) {
      throw new ForbiddenException('Нет доступа к пространству');
    }
    if (requirement.presets.includes(member.preset)) {
      return true;
    }
    throw new ForbiddenException('Недостаточно прав для действия');
  }

  private async resolveSpaceId(
    resource: PresetResource,
    request: AuthedRequest,
  ): Promise<string | null> {
    const params = request.params ?? {};
    const byId = (key: string) => params[key] ?? params.id ?? null;

    switch (resource) {
      case 'space':
        return byId('spaceId');
      case 'space-body': {
        const value = request.body?.space_id;
        return typeof value === 'string' ? value : null;
      }
      case 'source': {
        const id = byId('sourceId');
        if (!id) return null;
        const source = await this.prisma.source.findFirst({
          where: { id },
          select: { space_id: true },
        });
        return source?.space_id ?? null;
      }
      case 'event': {
        const id = byId('eventId');
        if (!id) return null;
        const event = await this.prisma.event.findFirst({
          where: { id },
          select: { source: { select: { space_id: true } } },
        });
        return event?.source.space_id ?? null;
      }
      case 'member': {
        const id = byId('memberId');
        if (!id) return null;
        const member = await this.prisma.spaceMember.findUnique({
          where: { id },
          select: { space_id: true },
        });
        return member?.space_id ?? null;
      }
      case 'token': {
        const id = byId('tokenId');
        if (!id) return null;
        const token = await this.prisma.token.findUnique({
          where: { id },
          select: { space_id: true },
        });
        return token?.space_id ?? null;
      }
      default:
        return null;
    }
  }
}
