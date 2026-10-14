import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('Плетение worker запущен (BullMQ, заглушка этапа 0)');
  void app;
}

void bootstrap();
