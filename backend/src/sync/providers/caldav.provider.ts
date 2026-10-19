import { ExternalProvider } from '@prisma/client';
import { createDAVClient, DAVCalendar, DAVCalendarObject, DAVObject } from 'tsdav';
import { parseIcalEvent } from '../ical/ical-parser';
import { SyncConflictError } from '../sync-errors';
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
  createCalendarObject(
    calendarUrl: string,
    filename: string,
    iCal: string,
  ): Promise<Response>;
  updateCalendarObject(
    objectUrl: string,
    etag: string,
    iCal: string,
  ): Promise<Response>;
  deleteCalendarObject(objectUrl: string): Promise<Response>;
}

export type DavClientFactory = (
  credentials: ProviderCredentials,
) => Promise<DavClient>;

/** Яндекс требует явный User-Agent, иначе может вернуть 403. */
const USER_AGENT = 'Pletenie/0.1 (Sync-Engine)';

const defaultFactory: DavClientFactory = async ({ url, username, password }) => {
  const baseFetch = globalThis.fetch;
  const fetchWithUserAgent = (async (
    input: Parameters<typeof baseFetch>[0],
    init?: Parameters<typeof baseFetch>[1],
  ) => {
    const headers = new Headers(init?.headers);
    headers.set('User-Agent', USER_AGENT);
    return baseFetch(input, { ...init, headers });
  }) as typeof baseFetch;

  const client = await createDAVClient({
    serverUrl: url,
    credentials: { username, password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
    fetch: fetchWithUserAgent,
  });

  const findCalendar = async (calendarUrl: string): Promise<DAVCalendar> => {
    const calendars = await client.fetchCalendars();
    const calendar = calendars.find((item) => item.url === calendarUrl);
    if (!calendar) {
      throw new Error(`Calendar not found: ${calendarUrl}`);
    }
    return calendar;
  };

  return {
    fetchCalendars: () => client.fetchCalendars(),
    fetchCalendarObjects: async (calendarUrl) =>
      client.fetchCalendarObjects({ calendar: await findCalendar(calendarUrl) }),
    createCalendarObject: async (calendarUrl, filename, iCal) =>
      client.createCalendarObject({
        calendar: await findCalendar(calendarUrl),
        filename,
        iCalString: iCal,
      }),
    updateCalendarObject: (objectUrl, etag, iCal) =>
      client.updateCalendarObject({
        calendarObject: { url: objectUrl, data: iCal, etag },
      }),
    deleteCalendarObject: (objectUrl) =>
      client.deleteCalendarObject({ calendarObject: { url: objectUrl } }),
  };
};

/**
 * CalDAV-провайдер (Яндекс, Mail.ru, локальный Radicale).
 * `listCalendars`, `pull` (Фаза 2), `push`/`delete` (Фаза 3).
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

  async push(calendarId: string, event: RemoteEvent): Promise<RemoteEvent> {
    const client = await this.factory(this.credentials);

    if (event.etag === null) {
      const response = await client.createCalendarObject(
        calendarId,
        `${event.uid}.ics`,
        event.ical,
      );
      this.assertWritable(response, event.uid, 'создать');
      const etag = await this.readEtag(client, calendarId, event.uid, response);
      return { uid: event.uid, etag, ical: event.ical };
    }

    const url = await this.findObjectUrl(client, calendarId, event.uid);
    if (!url) {
      throw new SyncConflictError('Событие отсутствует во внешнем календаре');
    }
    const response = await client.updateCalendarObject(
      url,
      event.etag,
      event.ical,
    );
    this.assertWritable(response, event.uid, 'обновить');
    const etag = await this.readEtag(client, calendarId, event.uid, response);
    return { uid: event.uid, etag, ical: event.ical };
  }

  async delete(calendarId: string, externalId: string): Promise<void> {
    const client = await this.factory(this.credentials);
    const url = await this.findObjectUrl(client, calendarId, externalId);
    if (!url) {
      return; // уже удалено во внешнем календаре
    }
    const response = await client.deleteCalendarObject(url);
    if (!response.ok && response.status !== 404 && response.status !== 412) {
      throw new Error(
        `Не удалось удалить событие ${externalId}: ${response.status} ${response.statusText}`,
      );
    }
  }

  private assertWritable(response: Response, uid: string, action: string) {
    if (response.ok) {
      return;
    }
    if (response.status === 412) {
      throw new SyncConflictError(
        'ETag не совпал: событие изменено во внешнем календаре',
      );
    }
    if (response.status === 404) {
      throw new SyncConflictError('Событие отсутствует во внешнем календаре');
    }
    throw new Error(
      `Не удалось ${action} событие ${uid}: ${response.status} ${response.statusText}`,
    );
  }

  private async readEtag(
    client: DavClient,
    calendarId: string,
    uid: string,
    response: Response,
  ): Promise<string | null> {
    const header = response.headers.get('etag');
    if (header) {
      return header;
    }
    const objects = await client.fetchCalendarObjects(calendarId);
    const match = objects.find((object) => this.uidOf(object) === uid);
    return match?.etag ?? null;
  }

  private async findObjectUrl(
    client: DavClient,
    calendarId: string,
    uid: string,
  ): Promise<string | null> {
    const objects = await client.fetchCalendarObjects(calendarId);
    const match = objects.find((object) => this.uidOf(object) === uid);
    return match?.url ?? null;
  }

  private uidOf(object: DAVObject): string | null {
    if (typeof object.data !== 'string') {
      return null;
    }
    return parseIcalEvent(object.data)?.uid ?? null;
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
