import ical, { ICalCalendarMethod } from 'ical-generator';
import type { Event } from '@prisma/client';

/**
 * Сериализует локальное событие в iCalendar (VEVENT).
 *
 * Даты хранятся как инстанты (UTC), поэтому события выводятся в UTC — это
 * совместимо с Яндексом, Mail.ru и Radicale без генерации VTIMEZONE.
 * UID = `external_id` (если событие уже во внешнем календаре) либо `id`.
 */
export function serializeEvent(event: Event): string {
  const calendar = ical({
    prodId: '//Pletenie//Sync//RU',
    method: ICalCalendarMethod.PUBLISH,
  });

  calendar.createEvent({
    id: event.external_id ?? event.id,
    start: event.start_at,
    end: event.end_at,
    allDay: event.all_day,
    stamp: event.updated_at,
    lastModified: event.updated_at,
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
  });

  return calendar.toString();
}
