import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';

function loadEnv(): void {
  const envPath = resolve(__dirname, '..', '.env');
  if (!existsSync(envPath)) {
    return;
  }
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || process.env[match[1]] !== undefined) {
      continue;
    }
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

loadEnv();

const prisma = new PrismaClient();
const channel = 'pletenie:realtime';

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length);
}

async function main(): Promise<void> {
  const email = argValue('email') ?? process.env.E2E_EMAIL;
  if (!email) {
    throw new Error('Укажите email: --email=user@example.com');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error(`Пользователь ${email} не найден`);
  }

  const map = await prisma.sourceExternalMap.findFirst({
    where: { source: { space: { owner_id: user.id } } },
    select: {
      source_id: true,
      external_connection_id: true,
      external_calendar_id: true,
    },
  });
  if (!map) {
    throw new Error('У пользователя нет источника с внешним календарём');
  }

  const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  start.setUTCMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const title = 'Realtime Conflict';

  const event = await prisma.event.create({
    data: {
      source_id: map.source_id,
      creator_id: user.id,
      title,
      description: 'Local realtime description',
      location: 'Local Office',
      start_at: start,
      end_at: end,
      timezone: 'UTC',
      sync_status: 'conflict',
    },
  });

  const localData = {
    title,
    description: 'Local realtime description',
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    all_day: false,
    timezone: 'UTC',
    location: 'Local Office',
    rrule: null,
  };
  const externalData = {
    title: 'Realtime External',
    description: 'External realtime description',
    start_at: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
    end_at: new Date(end.getTime() + 30 * 60 * 1000).toISOString(),
    all_day: false,
    timezone: 'UTC',
    location: 'External Office',
    rrule: null,
  };

  const conflict = await prisma.syncConflict.create({
    data: {
      event_id: event.id,
      external_connection_id: map.external_connection_id,
      local_data: localData,
      external_data: externalData,
      external_etag: '"realtime-etag"',
    },
  });

  const redis = new IORedis(
    process.env.REDIS_URL ?? 'redis://localhost:6379',
    { maxRetriesPerRequest: null },
  );
  redis.on('error', (error) => console.error(error.message));
  await redis.publish(
    channel,
    JSON.stringify({
      userId: user.id,
      event: 'sync.conflict',
      payload: {
        conflict_id: conflict.id,
        event_id: event.id,
        title,
      },
    }),
  );
  redis.disconnect();

  console.log(
    JSON.stringify(
      {
        userId: user.id,
        email: user.email,
        sourceId: map.source_id,
        eventId: event.id,
        conflictId: conflict.id,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
