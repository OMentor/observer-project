import { parseIcalEvent } from './ical-parser';

function wrap(vevent: string): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pletenie//Test//EN',
    vevent,
    'END:VCALENDAR',
  ].join('\r\n');
}

const CRLF = '\r\n';

describe('parseIcalEvent', () => {
  it('парсит обычное событие с датой-временем', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:event-1',
        'DTSTAMP:20261015T090000Z',
        'DTSTART:20261020T100000Z',
        'DTEND:20261020T113000Z',
        'SUMMARY:Встреча с командой',
        'DESCRIPTION:Обсудить релиз',
        'LOCATION:Офис',
        'END:VEVENT',
      ].join(CRLF),
    );

    const parsed = parseIcalEvent(ics);

    expect(parsed).not.toBeNull();
    expect(parsed!.uid).toBe('event-1');
    expect(parsed!.title).toBe('Встреча с командой');
    expect(parsed!.description).toBe('Обсудить релиз');
    expect(parsed!.location).toBe('Офис');
    expect(parsed!.allDay).toBe(false);
    expect(parsed!.rrule).toBeNull();
    expect(parsed!.startAt.toISOString()).toBe('2026-10-20T10:00:00.000Z');
    expect(parsed!.endAt.toISOString()).toBe('2026-10-20T11:30:00.000Z');
    expect(parsed!.timezone).toBe('UTC');
  });

  it('распознаёт событие на весь день (DATETYPE=date)', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:allday-1',
        'DTSTAMP:20261015T090000Z',
        'DTSTART;VALUE=DATE:20261021',
        'DTEND;VALUE=DATE:20261022',
        'SUMMARY:Отпуск',
        'END:VEVENT',
      ].join(CRLF),
    );

    const parsed = parseIcalEvent(ics);

    expect(parsed!.allDay).toBe(true);
    expect(parsed!.title).toBe('Отпуск');
    expect(parsed!.startAt.getUTCFullYear()).toBe(2026);
    expect(parsed!.startAt.getUTCMonth()).toBe(9);
    expect(parsed!.startAt.getUTCDate()).toBe(21);
  });

  it('извлекает RRULE как строку', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:recurring-1',
        'DTSTAMP:20261015T090000Z',
        'DTSTART:20261020T100000Z',
        'DTEND:20261020T110000Z',
        'SUMMARY:Еженедельный стендап',
        'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10',
        'END:VEVENT',
      ].join(CRLF),
    );

    const parsed = parseIcalEvent(ics);

    expect(parsed!.rrule).toContain('FREQ=WEEKLY');
    expect(parsed!.rrule).toContain('COUNT=10');
  });

  it('учитывает часовой пояс (TZID)', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:tz-1',
        'DTSTAMP:20261015T090000Z',
        'DTSTART;TZID=Europe/Moscow:20261020T130000',
        'DTEND;TZID=Europe/Moscow:20261020T140000',
        'SUMMARY:Звонок',
        'END:VEVENT',
      ].join(CRLF),
    );

    const parsed = parseIcalEvent(ics);

    expect(parsed!.timezone).toBe('Europe/Moscow');
    // 13:00 MSK = 10:00 UTC
    expect(parsed!.startAt.toISOString()).toBe('2026-10-20T10:00:00.000Z');
  });

  it('возвращает null без VEVENT', () => {
    const ics = wrap(
      [
        'BEGIN:VTODO',
        'UID:todo-1',
        'DTSTAMP:20261015T090000Z',
        'SUMMARY:Задача',
        'END:VTODO',
      ].join(CRLF),
    );

    expect(parseIcalEvent(ics)).toBeNull();
  });

  it('подставляет «Без названия» при отсутствии SUMMARY', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:no-summary',
        'DTSTAMP:20261015T090000Z',
        'DTSTART:20261020T100000Z',
        'DTEND:20261020T110000Z',
        'END:VEVENT',
      ].join(CRLF),
    );

    expect(parseIcalEvent(ics)!.title).toBe('Без названия');
  });
});
