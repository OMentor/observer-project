import { Injectable } from '@nestjs/common';
import { Event as CalendarEvent, Preset } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { maskEvent } from '../events/event-mask';
import { RealtimeGateway } from './realtime.gateway';
import { EventAction, RealtimeEvents } from './realtime.events';

export interface SourceRef {
  space_id: string;
  visibility: 'SHARED' | 'PRIVATE' | string;
}

@Injectable()
export class RealtimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway,
  ) {}

  async eventChanged(
    action: EventAction,
    event: CalendarEvent,
    source: SourceRef,
    actorId: string,
  ): Promise<void> {
    const targets = await this.resolveTargets(source.space_id);
    for (const [userId, preset] of targets) {
      if (source.visibility === 'PRIVATE' && preset !== 'FULL') {
        continue;
      }
      const masked = maskEvent(event, preset, userId);
      this.gateway.emitToUser(userId, action, {
        space_id: source.space_id,
        source_id: event.source_id,
        event: masked,
        actor_id: actorId,
      });
    }
  }

  memberJoined(
    spaceId: string,
    userId: string,
    preset: Preset,
    actorId: string,
  ): void {
    const payload = {
      space_id: spaceId,
      user_id: userId,
      preset,
      actor_id: actorId,
    };
    this.gateway.emitToSpace(spaceId, RealtimeEvents.memberJoined, payload);
    this.gateway.emitToUser(userId, RealtimeEvents.memberJoined, payload);
  }

  memberUpdated(
    spaceId: string,
    memberId: string,
    userId: string,
    preset: Preset,
    actorId: string,
  ): void {
    const payload = {
      space_id: spaceId,
      member_id: memberId,
      user_id: userId,
      preset,
      actor_id: actorId,
    };
    this.gateway.emitToSpace(spaceId, RealtimeEvents.memberUpdated, payload);
    this.gateway.emitToUser(userId, RealtimeEvents.memberUpdated, payload);
  }

  async memberKicked(
    spaceId: string,
    userId: string,
    actorId: string,
  ): Promise<void> {
    await this.gateway.removeUserFromSpace(userId, spaceId);
    const payload = { space_id: spaceId, user_id: userId, actor_id: actorId };
    this.gateway.emitToUser(userId, RealtimeEvents.memberKicked, payload);
    this.gateway.emitToSpace(spaceId, RealtimeEvents.memberKicked, payload);
  }

  tokenActivated(spaceId: string, userId: string, preset: Preset): void {
    this.gateway.emitToSpace(spaceId, RealtimeEvents.tokenActivated, {
      space_id: spaceId,
      user_id: userId,
      preset,
      actor_id: userId,
    });
  }

  private async resolveTargets(spaceId: string): Promise<Map<string, Preset>> {
    const targets = new Map<string, Preset>();
    const space = await this.prisma.space.findFirst({
      where: { id: spaceId, deleted_at: null },
      select: { owner_id: true },
    });
    if (space) {
      targets.set(space.owner_id, 'FULL');
    }
    const members = await this.prisma.spaceMember.findMany({
      where: { space_id: spaceId, revoked_at: null },
      select: { user_id: true, preset: true },
    });
    for (const member of members) {
      if (!targets.has(member.user_id)) {
        targets.set(member.user_id, member.preset);
      }
    }
    return targets;
  }
}
