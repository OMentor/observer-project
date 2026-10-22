import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { PullService } from '../sync/pull/pull.service';
import { PushService } from '../sync/push/push.service';
import { createSyncWorker } from './sync.worker';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const config = app.get(ConfigService);
  const redisUrl = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  const pull = app.get(PullService);
  const push = app.get(PushService);

  const worker = createSyncWorker(redisUrl, async (data) => {
    if (data.pushEventId) {
      const outcome = await push.pushEvent(data.pushEventId);
      console.log(`[sync] push события ${data.pushEventId}: ${outcome}`);
      return;
    }
    if (!data.sourceMapId) {
      console.warn('[sync] задание без цели пропущено', data);
      return;
    }
    const stats = await pull.pullSourceMap(data.sourceMapId);
    console.log(
      `[sync] источник ${data.sourceMapId}: +${stats.created} ~${stats.updated} -${stats.deleted} (=${stats.skipped})`,
    );
  });
  console.log('Плетение worker запущен (BullMQ очередь: sync)');

  const shutdown = async () => {
    await worker.close();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void bootstrap();
