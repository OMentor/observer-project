import type { CalendarEvent } from '@/lib/types';

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const WEEKDAYS_FULL = [
  'воскресенье',
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
];

export type DaySectionId = 'allDay' | 'morning' | 'day' | 'evening';

export type DaySection = {
  id: DaySectionId;
  label: string;
  events: CalendarEvent[];
};

export function dayTitle(date: Date): string {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}, ${
    WEEKDAYS_FULL[date.getDay()]
  }`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function groupDaySections(events: CalendarEvent[]): DaySection[] {
  const sections: DaySection[] = [
    { id: 'allDay', label: 'Весь день', events: [] },
    { id: 'morning', label: 'Утро', events: [] },
    { id: 'day', label: 'День', events: [] },
    { id: 'evening', label: 'Вечер', events: [] },
  ];
  const byId = new Map(sections.map((section) => [section.id, section]));
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );
  for (const event of sorted) {
    if (event.all_day) {
      byId.get('allDay')?.events.push(event);
      continue;
    }
    const hour = new Date(event.start_at).getHours();
    if (hour < 12) {
      byId.get('morning')?.events.push(event);
    } else if (hour < 18) {
      byId.get('day')?.events.push(event);
    } else {
      byId.get('evening')?.events.push(event);
    }
  }
  return sections.filter((section) => section.events.length > 0);
}
