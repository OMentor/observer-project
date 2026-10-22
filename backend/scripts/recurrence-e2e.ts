import { randomUUID } from 'node:crypto';

interface LoginResult {
  accessToken: string;
  user: { id: string; email: string };
}

interface SpaceResult {
  id: string;
}

interface SourceResult {
  id: string;
}

interface ConnectionResult {
  id: string;
}

interface CreatedEvent {
  id: string;
  rrule: string | null;
}

interface ListedEvent {
  id: string;
  title: string;
  start_at: string;
  original_start_at: string | null;
}

interface ExceptionResult {
  id: string;
  is_deleted: boolean;
}

interface LinkResult {
  stats: {
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
  };
}

interface DavResponse {
  status: number;
  text: string;
}

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length);
}

const apiUrl = (
  argValue('api') ??
  process.env.API_URL ??
  'http://localhost:3000'
).replace(/\/$/, '');
const caldavUrl = (
  argValue('caldav') ??
  process.env.CALDAV_URL ??
  'http://localhost:5232'
).replace(/\/$/, '');
const email =
  argValue('email') ?? process.env.E2E_EMAIL ?? 'demo@pletenie.local';
const password = argValue('password') ?? process.env.E2E_PASSWORD;
const caldavUsername =
  argValue('caldav-username') ?? process.env.CALDAV_USERNAME ?? 'dev';
const caldavPassword =
  argValue('caldav-password') ?? process.env.CALDAV_PASSWORD ?? '';
const provider = argValue('provider') ?? process.env.E2E_PROVIDER ?? 'yandex';
const keep = process.argv.includes('--keep');

const basicAuth =
  'Basic ' +
  Buffer.from(`${caldavUsername}:${caldavPassword}`).toString('base64');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function api<T>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(apiUrl + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${text}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

async function dav(
  method: string,
  path: string,
  options: { body?: string; headers?: Record<string, string> } = {},
): Promise<DavResponse> {
  const response = await fetch(caldavUrl + path, {
    method,
    headers: {
      authorization: basicAuth,
      ...(options.headers ?? {}),
    },
    body: options.body,
  });
  const text = await response.text();
  if (!response.ok && response.status !== 207) {
    throw new Error(`DAV ${method} ${path} -> ${response.status} ${text}`);
  }
  return { status: response.status, text };
}

function toAbsolute(href: string): string {
  if (/^https?:\/\//.test(href)) {
    return href;
  }
  return caldavUrl + (href.startsWith('/') ? '' : '/') + href;
}

async function listIcs(collectionPath: string): Promise<string[]> {
  const { text } = await dav('PROPFIND', collectionPath, {
    headers: { depth: '1', 'content-type': 'application/xml' },
    body:
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<propfind xmlns="DAV:"><prop><getetag/><resourcetype/></prop></propfind>',
  });
  return [...text.matchAll(/<[^>]*href>([^<]+\.ics)<\/[^>]*href>/g)].map(
    (match) => toAbsolute(match[1]),
  );
}

async function icsText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { authorization: basicAuth },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} -> ${response.status}`);
  }
  return response.text();
}

async function waitFor<T>(
  check: () => Promise<T | null | undefined | false>,
  label: string,
  timeoutMs = 40000,
): Promise<T> {
  const startedAt = Date.now();
  let lastError = '';
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const value = await check();
      if (value) {
        return value as T;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(1500);
  }
  throw new Error(
    `Timeout waiting for ${label}${lastError ? ` (${lastError})` : ''}`,
  );
}

function utcStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

async function main(): Promise<void> {
  if (!password) {
    throw new Error(
      'Укажите пароль пользователя: --password=... или E2E_PASSWORD',
    );
  }
  const stamp = Date.now();
  const collectionName = `recurrence-e2e-${stamp}-${randomUUID().slice(0, 8)}`;
  const collectionPath = `/${caldavUsername}/${collectionName}/`;
  const collectionUrl = caldavUrl + collectionPath;

  let token = '';
  let spaceId: string | undefined;
  let connectionId: string | undefined;
  let collectionCreated = false;
  const cleanupErrors: string[] = [];

  try {
    const login = await api<LoginResult>('POST', '/auth/login', {
      body: { email, password },
    });
    token = login.accessToken;
    console.log(`[login] ${login.user.email}`);

    await dav('MKCOL', collectionPath, {
      headers: { 'content-type': 'application/xml' },
      body:
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<mkcol xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">' +
        '<set><prop><resourcetype><collection/><C:calendar/></resourcetype>' +
        '<displayname>Pletenie recurrence E2E</displayname>' +
        '<supported-calendar-component-set><C:comp name="VEVENT"/></supported-calendar-component-set>' +
        '</prop></set></mkcol>',
    });
    collectionCreated = true;
    console.log(`[caldav] ${collectionPath}`);

    const space = await api<SpaceResult>('POST', '/spaces', {
      token,
      body: { name: `Recurrence E2E ${stamp}` },
    });
    spaceId = space.id;
    console.log(`[space] ${spaceId}`);

    const source = await api<SourceResult>(
      'POST',
      `/spaces/${spaceId}/sources`,
      {
        token,
        body: { name: `Recurrence E2E ${stamp}`, visibility: 'SHARED' },
      },
    );
    console.log(`[source] ${source.id}`);

    const connection = await api<ConnectionResult>('POST', '/sync/connections', {
      token,
      body: {
        provider,
        url: caldavUrl,
        username: caldavUsername,
        password: caldavPassword,
      },
    });
    connectionId = connection.id;
    console.log(`[connection] ${connectionId}`);

    const link = await api<LinkResult>(
      'POST',
      `/sources/${source.id}/link`,
      {
        token,
        body: {
          connectionId,
          externalCalendarId: collectionUrl,
          externalCalendarName: 'Pletenie recurrence E2E',
        },
      },
    );
    console.log(`[link] ${JSON.stringify(link.stats)}`);

    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 30);
    start.setUTCHours(7, 0, 0, 0);
    const occurrenceAt = (offsetDays: number) =>
      new Date(start.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    const movedOriginalAt = occurrenceAt(1);
    const deletedAt = occurrenceAt(2);
    const movedStart = new Date(movedOriginalAt.getTime() + 2 * 60 * 60 * 1000);

    const created = await api<CreatedEvent>(
      'POST',
      `/sources/${source.id}/events`,
      {
        token,
        body: {
          title: 'Ежедневный созвон',
          start_at: start.toISOString(),
          end_at: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
          timezone: 'Europe/Moscow',
          rrule: 'FREQ=DAILY;COUNT=4',
        },
      },
    );
    console.log(`[event] ${created.id}`);

    const icsUrl = await waitFor(
      async () => {
        const hrefs = await listIcs(collectionPath);
        return hrefs.length === 1 ? hrefs[0] : null;
      },
      'pushed series ics',
    );
    console.log(`[remote] ${icsUrl}`);

    const withRrule = await waitFor(
      async () => {
        const text = await icsText(icsUrl);
        return text.includes('RRULE:FREQ=DAILY;COUNT=4') ? text : null;
      },
      'RRULE in remote ics',
    );
    console.log('[assert] RRULE pushed');

    await api(
      'DELETE',
      `/events/${created.id}?scope=single&occurrence_at=${encodeURIComponent(
        deletedAt.toISOString(),
      )}`,
      { token },
    );
    console.log(`[delete] occurrence ${deletedAt.toISOString()}`);

    const withExdate = await waitFor(
      async () => {
        const text = await icsText(icsUrl);
        return text.includes(`EXDATE:${utcStamp(deletedAt)}`) ? text : null;
      },
      'EXDATE in remote ics',
    );
    if (!withExdate.includes(`EXDATE:${utcStamp(deletedAt)}`)) {
      throw new Error('EXDATE for deleted occurrence is missing');
    }
    console.log('[assert] EXDATE pushed');

    const overrideTitle = 'Перенесённый созвон';
    const override = await api<ExceptionResult>(
      'PATCH',
      `/events/${created.id}`,
      {
        token,
        body: {
          scope: 'single',
          occurrence_at: movedOriginalAt.toISOString(),
          title: overrideTitle,
          start_at: movedStart.toISOString(),
          end_at: new Date(movedStart.getTime() + 60 * 60 * 1000).toISOString(),
        },
      },
    );
    if (override.is_deleted) {
      throw new Error('Override exception is marked as deleted');
    }
    console.log(`[override] ${override.id}`);

    const withOverride = await waitFor(
      async () => {
        const text = await icsText(icsUrl);
        return text.includes('RECURRENCE-ID') && text.includes(overrideTitle)
          ? text
          : null;
      },
      'RECURRENCE-ID override in remote ics',
    );
    if (
      !withOverride.includes('RECURRENCE-ID') ||
      !withOverride.includes(overrideTitle)
    ) {
      throw new Error('RECURRENCE-ID override is missing');
    }
    console.log('[assert] RECURRENCE-ID pushed');

    const from = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const to = new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000);
    const listed = await api<ListedEvent[]>(
      'GET',
      `/sources/${source.id}/events?from=${encodeURIComponent(
        from.toISOString(),
      )}&to=${encodeURIComponent(to.toISOString())}`,
      { token },
    );

    const deletedVisible = listed.some(
      (event) =>
        event.original_start_at !== null &&
        new Date(event.original_start_at).toISOString() ===
          deletedAt.toISOString(),
    );
    const overrideVisible = listed.some(
      (event) =>
        event.title === overrideTitle &&
        event.original_start_at !== null &&
        new Date(event.original_start_at).toISOString() ===
          movedOriginalAt.toISOString(),
    );

    if (listed.length !== 3) {
      throw new Error(
        `Expected 3 occurrences in range, got ${listed.length}: ${JSON.stringify(
          listed.map((event) => ({
            title: event.title,
            start_at: event.start_at,
          })),
        )}`,
      );
    }
    if (deletedVisible) {
      throw new Error('Deleted occurrence is still visible in API');
    }
    if (!overrideVisible) {
      throw new Error('Overridden occurrence is missing in API');
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          collection: collectionUrl,
          sourceId: source.id,
          eventId: created.id,
          occurrences: listed.length,
          deletedOccurrenceHidden: !deletedVisible,
          overrideVisible,
          rrulePushed: withRrule.includes('RRULE:FREQ=DAILY;COUNT=4'),
          exdatePushed: withExdate.includes(`EXDATE:${utcStamp(deletedAt)}`),
          recurrenceIdPushed: withOverride.includes('RECURRENCE-ID'),
        },
        null,
        2,
      ),
    );
    console.log('E2E OK');
  } finally {
    if (!keep) {
      if (connectionId) {
        await api('DELETE', `/sync/connections/${connectionId}`, {
          token,
        }).catch((error: unknown) => {
          cleanupErrors.push(
            `connection: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
      }
      if (spaceId) {
        await api('DELETE', `/spaces/${spaceId}`, { token }).catch(
          (error: unknown) => {
            cleanupErrors.push(
              `space: ${error instanceof Error ? error.message : String(error)}`,
            );
          },
        );
      }
      if (collectionCreated) {
        await dav('DELETE', collectionPath).catch((error: unknown) => {
          cleanupErrors.push(
            `collection: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
      }
      if (cleanupErrors.length > 0) {
        console.warn(`[cleanup] ${cleanupErrors.join('; ')}`);
      }
    } else {
      console.log('[cleanup] skipped (--keep)');
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
