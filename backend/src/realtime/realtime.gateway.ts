import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { JwtPayload } from '../auth/jwt.strategy';
import { Public } from '../common/public.decorator';
import { RealtimeEvents } from './realtime.events';

type AuthedSocket = Socket & {
  data: { userId?: string };
};

function extractToken(client: Socket): string | null {
  const authToken = client.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken) {
    return authToken;
  }
  const queryToken = client.handshake.query?.token;
  if (typeof queryToken === 'string' && queryToken) {
    return queryToken;
  }
  const header = client.handshake.headers?.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

function userRoom(userId: string) {
  return `user:${userId}`;
}

function spaceRoom(spaceId: string) {
  return `space:${spaceId}`;
}

@Public()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
  ) {}

  async handleConnection(client: AuthedSocket): Promise<void> {
    try {
      const token = extractToken(client);
      if (!token) {
        throw new Error('Нет токена');
      }
      const payload = this.jwt.verify<JwtPayload>(token);
      if (payload.type && payload.type !== 'access') {
        throw new Error('Неверный тип токена');
      }
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub },
        select: { id: true },
      });
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      client.data.userId = user.id;
      await client.join(userRoom(user.id));

      const spaces = await this.prisma.space.findMany({
        where: {
          deleted_at: null,
          OR: [
            { owner_id: user.id },
            { members: { some: { user_id: user.id, revoked_at: null } } },
          ],
        },
        select: { id: true },
      });
      await Promise.all(spaces.map((space) => client.join(spaceRoom(space.id))));

      client.emit(RealtimeEvents.connected, { user_id: user.id });
    } catch (error) {
      this.logger.debug(
        `Отклонено WS-подключение: ${(error as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket): void {
    client.data.userId = undefined;
  }

  @SubscribeMessage(RealtimeEvents.spaceSubscribe)
  async onSubscribe(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { space_id?: string },
  ): Promise<{ ok: boolean; preset?: string; error?: string }> {
    const userId = client.data.userId;
    if (!userId) {
      return { ok: false, error: 'unauthorized' };
    }
    const spaceId = body?.space_id;
    if (!spaceId) {
      return { ok: false, error: 'space_id required' };
    }
    try {
      const access = await this.spaces.getAccess(userId, spaceId);
      await client.join(spaceRoom(spaceId));
      return { ok: true, preset: access.preset };
    } catch {
      return { ok: false, error: 'forbidden' };
    }
  }

  @SubscribeMessage(RealtimeEvents.spaceUnsubscribe)
  async onUnsubscribe(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { space_id?: string },
  ): Promise<{ ok: boolean }> {
    if (body?.space_id) {
      await client.leave(spaceRoom(body.space_id));
    }
    return { ok: true };
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    if (!this.server) {
      return;
    }
    this.server.to(userRoom(userId)).emit(event, payload);
  }

  emitToSpace(spaceId: string, event: string, payload: unknown): void {
    if (!this.server) {
      return;
    }
    this.server.to(spaceRoom(spaceId)).emit(event, payload);
  }

  async removeUserFromSpace(userId: string, spaceId: string): Promise<void> {
    if (!this.server) {
      return;
    }
    const sockets = await this.server.in(userRoom(userId)).fetchSockets();
    await Promise.all(
      sockets.map((socket) => socket.leave(spaceRoom(spaceId))),
    );
  }
}
