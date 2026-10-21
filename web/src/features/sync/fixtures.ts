import type { Conflict } from '@/lib/types';

/** Конфликт для тестов: локальная и внешняя версии различаются по всем полям. */
export function makeConflict(overrides: Partial<Conflict> = {}): Conflict {
  return {
    id: 'conflict-1',
    event_id: 'event-1',
    connection_id: 'conn-1',
    local_data: {
      title: 'Встреча с клиентом',
      description: null,
      start_at: '2026-12-05T10:00:00.000Z',
      end_at: '2026-12-05T11:00:00.000Z',
      all_day: false,
      timezone: 'UTC',
      location: 'Офис',
      rrule: null,
    },
    external_data: {
      title: 'Встреча с Аней',
      description: 'Новое описание',
      start_at: '2026-12-05T10:30:00.000Z',
      end_at: '2026-12-05T11:30:00.000Z',
      all_day: false,
      timezone: 'UTC',
      location: null,
      rrule: null,
    },
    external_etag: '"etag-2"',
    resolution: null,
    resolved_at: null,
    created_at: '2026-12-05T09:00:00.000Z',
    event: {
      id: 'event-1',
      title: 'Встреча с клиентом',
      source_id: 'source-1',
    },
    ...overrides,
  };
}

/** Ошибка в форме axios-ответа для проверки статус-кодов. */
export function axiosStatusError(status: number): Error {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status },
  });
}
