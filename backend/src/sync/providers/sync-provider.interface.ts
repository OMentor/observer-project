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
 *
 * - `pull` — Фаза 2 (полная выборка, инкремент по ETag).
 * - `push` — Фаза 3: `event.etag === null` → создание (If-None-Match: *),
 *   иначе обновление с оптимистичной блокировкой (If-Match). Бросает
 *   `SyncConflictError` при 412/404. Возвращает актуальный ETag.
 * - `forcePush` — Фаза 4: безусловная перезапись версии пользователя
 *   (без `If-Match`); если объекта нет — создаёт заново. Используется при
 *   разрешении конфликта «наша версия»/«объединение».
 * - `delete` — Фаза 3: удаляет объект по UID; отсутствие — не ошибка.
 */
export interface SyncProvider {
  readonly provider: ExternalProvider;
  listCalendars(): Promise<ExternalCalendar[]>;
  pull(calendarId: string): Promise<PullResult>;
  push(calendarId: string, event: RemoteEvent): Promise<RemoteEvent>;
  forcePush(calendarId: string, event: RemoteEvent): Promise<RemoteEvent>;
  delete(calendarId: string, externalId: string): Promise<void>;
}
