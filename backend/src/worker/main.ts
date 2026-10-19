import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { createSyncWorker } from './sync.worker';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const config = app.get(ConfigService);
  const redisUrl = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

  const worker = createSyncWorker(redisUrl);
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
