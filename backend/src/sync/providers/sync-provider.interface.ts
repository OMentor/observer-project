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

/** Событие во внешнем календаре, полученное при pull. */
export interface RemoteEvent {
  /** UID события у провайдера (`VEVENT.UID`). */
  uid: string;
  /** ETag версии для оптимистичной блокировки. */
  etag: string | null;
  /** iCalendar-полезная нагрузка (`.ics`). */
  ical: string;
}

/**
 * Результат pull — полный набор событий календаря.
 * Удалённые события вычисляются сравнением с локальной БД.
 */
export interface PullResult {
  events: RemoteEvent[];
}

/**
 * Общий контракт провайдера синхронизации.
 * Фаза 2: `pull`. push/delete — Фаза 3.
 */
export interface SyncProvider {
  readonly provider: ExternalProvider;
  listCalendars(): Promise<ExternalCalendar[]>;
  pull(calendarId: string): Promise<PullResult>;
  push(event: RemoteEvent): Promise<RemoteEvent>;
  delete(calendarId: string, externalId: string): Promise<void>;
}
