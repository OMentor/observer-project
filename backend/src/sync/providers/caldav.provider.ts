import { ExternalProvider } from '@prisma/client';
import { createDAVClient, DAVCalendar, DAVCalendarObject, DAVObject } from 'tsdav';
import { parseIcalEvent } from '../ical/ical-parser';
import {
  ExternalCalendar,
  ProviderCredentials,
  PullResult,
  RemoteEvent,
  SyncProvider,
} from './sync-provider.interface';

/** Минимальный контракт DAV-клиента, который использует провайдер. */
export interface DavClient {
  fetchCalendars(): Promise<DAVCalendar[]>;
  fetchCalendarObjects(calendarUrl: string): Promise<DAVCalendarObject[]>;
}

export type DavClientFactory = (
  credentials: ProviderCredentials,
) => Promise<DavClient>;

/** Яндекс требует явный User-Agent, иначе может вернуть 403. */
const USER_AGENT = 'Pletenie/0.1 (Sync-Engine)';

const defaultFactory: DavClientFactory = ({ url, username, password }) => {
  const baseFetch = globalThis.fetch;
  const fetchWithUserAgent = (async (
    input: Parameters<typeof baseFetch>[0],
    init?: Parameters<typeof baseFetch>[1],
  ) => {
    const headers = new Headers(init?.headers);
    headers.set('User-Agent', USER_AGENT);
    return baseFetch(input, { ...init, headers });
  }) as typeof baseFetch;

  return createDAVClient({
    serverUrl: url,
    credentials: { username, password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
    fetch: fetchWithUserAgent,
  }).then((client) => ({
    fetchCalendars: () => client.fetchCalendars(),
    fetchCalendarObjects: async (calendarUrl) => {
      const calendars = await client.fetchCalendars();
      const calendar = calendars.find((item) => item.url === calendarUrl);
      if (!calendar) {
        throw new Error(`Calendar not found: ${calendarUrl}`);
      }
      return client.fetchCalendarObjects({ calendar });
    },
  }));
};

/**
 * CalDAV-провайдер (Яндекс, Mail.ru, локальный Radicale).
 * Фаза 2: `listCalendars` + `pull` (полная выборка, инкремент по ETag).
 * push/delete — Фаза 3.
 */
export class CaldavProvider implements SyncProvider {
  readonly provider: ExternalProvider;

  constructor(
    private readonly credentials: ProviderCredentials,
    provider: ExternalProvider = 'yandex',
    private readonly factory: DavClientFactory = defaultFactory,
  ) {
    this.provider = provider;
  }

  async listCalendars(): Promise<ExternalCalendar[]> {
    const client = await this.factory(this.credentials);
    const calendars = await client.fetchCalendars();
    return calendars.map((calendar) => ({
      id: calendar.url,
      name: typeof calendar.displayName === 'string' ? calendar.displayName : '',
    }));
  }

  async pull(calendarId: string): Promise<PullResult> {
    const client = await this.factory(this.credentials);
    const objects = await client.fetchCalendarObjects(calendarId);
    return { events: this.toRemoteEvents(objects) };
  }

  push(_event: RemoteEvent): Promise<RemoteEvent> {
    return Promise.reject(new Error('Not implemented yet (Phase 3)'));
  }

  delete(_calendarId: string, _externalId: string): Promise<void> {
    return Promise.reject(new Error('Not implemented yet (Phase 3)'));
  }

  private toRemoteEvents(objects: DAVObject[]): RemoteEvent[] {
    const events: RemoteEvent[] = [];
    for (const object of objects) {
      if (typeof object.data !== 'string') {
        continue;
      }
      const parsed = parseIcalEvent(object.data);
      if (!parsed) {
        continue;
      }
      events.push({
        uid: parsed.uid,
        etag: object.etag ?? null,
        ical: object.data,
      });
    }
    return events;
  }
}
