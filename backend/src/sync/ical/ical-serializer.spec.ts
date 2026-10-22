import type { Event, EventException } from '@prisma/client';
import { serializeEvent } from './ical-serializer';

function exception(overrides: Partial<EventException> = {}): EventException {
  return {
    id: '22222222-2222-2222-2222-222222222222',
    event_id: '11111111-1111-1111-1111-111111111111',
    occurrence_at: new Date('2026-12-08T10:00:00.000Z'),
    is_deleted: false,
    title: 'Созвон (перенесён)',
    description: null,
    start_at: new Date('2026-12-08T12:00:00.000Z'),
    end_at: new Date('2026-12-08T13:00:00.000Z'),
    all_day: null,
    timezone: null,
    location: null,
    rrule: null,
    external_etag: null,
    sync_status: 'local',
    created_at: new Date('2026-11-01T00:00:00.000Z'),
    updated_at: new Date('2026-11-02T00:00:00.000Z'),
    ...overrides,
  };
}

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    source_id: 'src1',
    creator_id: 'u1',
    title: 'Созвон',
    description: null,
    start_at: new Date('2026-12-01T10:00:00.000Z'),
    end_at: new Date('2026-12-01T11:00:00.000Z'),
    all_day: false,
    timezone: 'UTC',
    location: null,
    rrule: null,
    recurrence_parent_id: null,
    recurrence_exceptions: null,
    created_at: new Date('2026-11-01T00:00:00.000Z'),
    updated_at: new Date('2026-11-02T00:00:00.000Z'),
    deleted_at: null,
    external_id: null,
    external_provider: null,
    external_etag: null,
    sync_status: 'local',
    last_synced_at: null,
    ...overrides,
  };
}

describe('serializeEvent', () => {
  it('сериализует обычное событие с UID, SUMMARY и временем', () => {
    const ics = serializeEvent(event());

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:11111111-1111-1111-1111-111111111111');
    expect(ics).toContain('SUMMARY:Созвон');
    expect(ics).toContain('DTSTART:20261201T100000Z');
    expect(ics).toContain('DTEND:20261201T110000Z');
    expect(ics).not.toContain('VALUE=DATE');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('использует external_id как UID, если событие уже во внешнем календаре', () => {
    const ics = serializeEvent(event({ external_id: 'remote-uid' }));

    expect(ics).toContain('UID:remote-uid');
    expect(ics).not.toContain('UID:11111111-1111-1111-1111-111111111111');
  });

  it('сериализует all-day событие как VALUE=DATE', () => {
    const ics = serializeEvent(
      event({
        all_day: true,
        start_at: new Date('2026-12-01T00:00:00.000Z'),
        end_at: new Date('2026-12-02T00:00:00.000Z'),
      }),
    );

    expect(ics).toContain('DTSTART;VALUE=DATE:20261201');
    expect(ics).toContain('DTEND;VALUE=DATE:20261202');
    expect(ics).toContain('X-MICROSOFT-CDO-ALLDAYEVENT:TRUE');
  });

  it('включает описание и локацию, если заданы', () => {
    const ics = serializeEvent(
      event({ description: 'Обсудить релиз', location: 'Офис' }),
    );

    expect(ics).toContain('DESCRIPTION:Обсудить релиз');
    expect(ics).toContain('LOCATION:Офис');
  });

  it('сериализует RRULE родителя', () => {
    const ics = serializeEvent(
      event({ rrule: 'FREQ=WEEKLY;BYDAY=TU;COUNT=6' }),
    );

    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=6');
  });

  it('добавляет EXDATE для удалённого вхождения', () => {
    const ics = serializeEvent(
      event({ rrule: 'FREQ=WEEKLY;BYDAY=TU;COUNT=6' }),
      [
        exception({
          is_deleted: true,
          title: null,
          description: null,
          start_at: null,
          end_at: null,
          occurrence_at: new Date('2026-12-08T10:00:00.000Z'),
        }),
      ],
    );

    expect(ics).toContain('EXDATE:20261208T100000Z');
    expect(ics).not.toContain('RECURRENCE-ID');
  });

  it('добавляет VEVENT с RECURRENCE-ID для переопределения', () => {
    const ics = serializeEvent(
      event({ rrule: 'FREQ=WEEKLY;BYDAY=TU;COUNT=6' }),
      [exception()],
    );

    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(
      ics.match(/UID:11111111-1111-1111-1111-111111111111/g),
    ).toHaveLength(2);
    expect(ics).toContain('RECURRENCE-ID:20261208T100000Z');
    expect(ics).toContain('DTSTART:20261208T120000Z');
    expect(ics).toContain('SUMMARY:Созвон (перенесён)');
  });

  it('добавляет EXDATE в формате DATE для событий на весь день', () => {
    const ics = serializeEvent(
      event({
        all_day: true,
        rrule: 'FREQ=WEEKLY;BYDAY=TU;COUNT=6',
        start_at: new Date('2026-12-01T00:00:00.000Z'),
        end_at: new Date('2026-12-02T00:00:00.000Z'),
      }),
      [
        exception({
          is_deleted: true,
          title: null,
          description: null,
          start_at: null,
          end_at: null,
          occurrence_at: new Date('2026-12-08T00:00:00.000Z'),
        }),
      ],
    );

    expect(ics).toContain('EXDATE;VALUE=DATE:20261208');
  });
});
