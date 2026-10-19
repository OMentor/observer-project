import { ExternalProvider } from '@prisma/client';

/** Внешний календарь у провайдера (коллекция CalDAV). */
export interface ExternalCalendar {
  /** href/URL коллекции — используется как `external_calendar_id`. */
  id: string;
  name: string;
}

/** Реквизиты подключения к CalDAV (расшифрованные). */
export interface ProviderCredentials {
  url: string;
  username: string;
  password: string;
}

/** Событие во внешнем календаре. */
export interface RemoteEvent {
  /** UID события у провайдера (`VEVENT.UID`). */
  id: string;
  /** ETag версии для оптимистичной блокировки. */
  etag?: string;
  /** iCalendar-полезная нагрузка. */
  data?: unknown;
}

export interface PullResult {
  events: RemoteEvent[];
  syncToken?: string | null;
}

/**
 * Общий контракт провайдера синхронизации.
 * Фаза 1 реализует только `listCalendars`; pull/push/delete — Фазы 2/3.
 */
export interface SyncProvider {
  readonly provider: ExternalProvider;
  listCalendars(): Promise<ExternalCalendar[]>;
  pull(syncToken?: string | null): Promise<PullResult>;
  push(event: RemoteEvent): Promise<RemoteEvent>;
  delete(externalId: string): Promise<void>;
}
