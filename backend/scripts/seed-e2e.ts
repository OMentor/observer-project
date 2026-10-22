import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ExternalProvider,
  PrismaClient,
  SyncDirection,
} from '@prisma/client';

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
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000';

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `${init.method ?? 'GET'} ${path} → ${response.status}: ${text}`,
    );
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; name: string };
}

interface SpaceResponse {
  id: string;
}

interface SourceResponse {
  id: string;
}

interface EventResponse {
  id: string;
}

async function main(): Promise<void> {
  const email =
    process.env.E2E_EMAIL ?? `e2e-${Date.now()}@pletenie.local`;
  const password = process.env.E2E_PASSWORD ?? 'password123';

  const auth = await api<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'E2E Tester',
      email,
      password,
      timezone: 'UTC',
    }),
  });
  const headers = { authorization: `Bearer ${auth.accessToken}` };

  const space = await api<SpaceResponse>('/spaces', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'E2E Space' }),
  });
  const source = await api<SourceResponse>(
    `/spaces/${space.id}/sources`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'E2E Source', color: '#5B5FEF' }),
    },
  );

  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  start.setUTCMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const event = await api<EventResponse>(
    `/sources/${source.id}/events`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Local Title',
        description: 'Local description',
        location: 'Local Office',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        timezone: 'UTC',
      }),
    },
  );

  const connection = await prisma.externalConnection.create({
    data: {
      user_id: auth.user.id,
      provider: ExternalProvider.yandex,
      caldav_url: process.env.E2E_CALDAV_URL ?? 'http://localhost:5232',
      caldav_username: 'e2e',
      caldav_password_enc: 'e2e-dummy-not-used-for-external',
    },
  });

  await prisma.sourceExternalMap.create({
    data: {
      source_id: source.id,
      external_connection_id: connection.id,
      external_calendar_id: 'e2e-dummy-calendar',
      external_calendar_name: 'E2E Dummy',
      sync_direction: SyncDirection.both,
    },
  });

  const externalStart = new Date(start.getTime() + 30 * 60 * 1000);
  const externalEnd = new Date(end.getTime() + 30 * 60 * 1000);

  const localData = {
    title: 'Local Title',
    description: 'Local description',
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    all_day: false,
    timezone: 'UTC',
    location: 'Local Office',
    rrule: null,
  };
  const externalData = {
    title: 'External Title',
    description: 'External description',
    start_at: externalStart.toISOString(),
    end_at: externalEnd.toISOString(),
    all_day: false,
    timezone: 'UTC',
    location: 'External Office',
    rrule: null,
  };

  const conflict = await prisma.syncConflict.create({
    data: {
      event_id: event.id,
      external_connection_id: connection.id,
      local_data: localData,
      external_data: externalData,
      external_etag: '"e2e-etag"',
    },
  });

  await prisma.event.update({
    where: { id: event.id },
    data: { sync_status: 'conflict' },
  });

  console.log(
    JSON.stringify(
      {
        apiUrl,
        email,
        password,
        accessToken: auth.accessToken,
        userId: auth.user.id,
        spaceId: space.id,
        sourceId: source.id,
        eventId: event.id,
        connectionId: connection.id,
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
