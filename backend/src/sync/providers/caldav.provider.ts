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

const defaultFactory: DavClientFactory = ({ url, username, password }) =>
  createDAVClient({
    serverUrl: url,
    credentials: { username, password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  });

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
