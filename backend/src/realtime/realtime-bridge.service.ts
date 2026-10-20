import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { RealtimeGateway } from './realtime.gateway';

/** Сообщение, передаваемое между процессами по Redis-шине. */
export interface RealtimeEnvelope {
  userId: string;
  event: string;
  payload: unknown;
}

/** Канал Redis pub/sub для ретрансляции realtime-событий между процессами. */
export const REALTIME_CHANNEL = 'pletenie:realtime';

/**
 * Мост realtime-событий через Redis pub/sub.
 *
 * Ретрив/пуш выполняются в отдельном процессе-воркере, у которого нет
 * WebSocket-сервера. Воркер публикует событие в Redis; API-процесс (у которого
 * есть `RealtimeGateway`) подписан на канал и рассылает его в комнату
 * `user:<userId>`. В воркере `emitToUser` — no-op (нет сервера), что безопасно.
 */
@Injectable()
export class RealtimeBridge implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeBridge.name);
  private readonly publisher: IORedis;
  private readonly subscriber: IORedis;

  constructor(
    config: ConfigService,
    private readonly gateway: RealtimeGateway,
  ) {
    const url = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.publisher = new IORedis(url, { maxRetriesPerRequest: null });
    this.publisher.on('error', (error) =>
      this.logger.warn(`Redis publisher: ${error.message}`),
    );
    this.subscriber = new IORedis(url, { maxRetriesPerRequest: null });
    this.subscriber.on('error', (error) =>
      this.logger.warn(`Redis subscriber: ${error.message}`),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.subscriber.subscribe(REALTIME_CHANNEL);
    this.subscriber.on('message', (channel: string, message: string) => {
      if (channel !== REALTIME_CHANNEL) {
        return;
      }
      try {
        const envelope = JSON.parse(message) as RealtimeEnvelope;
        this.gateway.emitToUser(
          envelope.userId,
          envelope.event,
          envelope.payload,
        );
      } catch (error) {
        this.logger.warn(
          `Некорректное сообщение шины: ${(error as Error).message}`,
        );
      }
    });
  }

  /** Публикует событие в Redis (доставляется клиентам процессом API). */
  async publish(userId: string, event: string, payload: unknown): Promise<void> {
    const envelope: RealtimeEnvelope = { userId, event, payload };
    await this.publisher.publish(REALTIME_CHANNEL, JSON.stringify(envelope));
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber.quit().catch(() => undefined);
    this.publisher.disconnect();
  }
}
