import { ExternalProvider } from '@prisma/client';
import { createDAVClient, DAVCalendar } from 'tsdav';
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
  });
};

/**
 * CalDAV-провайдер (Яндекс, Mail.ru, локальный Radicale).
 * Фаза 1: только `listCalendars`. Остальное — заглушки до Фаз 2/3.
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

  pull(_syncToken?: string | null): Promise<PullResult> {
    return Promise.reject(new Error('Not implemented yet (Phase 2)'));
  }

  push(_event: RemoteEvent): Promise<RemoteEvent> {
    return Promise.reject(new Error('Not implemented yet (Phase 3)'));
  }

  delete(_externalId: string): Promise<void> {
    return Promise.reject(new Error('Not implemented yet (Phase 3)'));
  }
}
