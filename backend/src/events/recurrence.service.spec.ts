import { Event, EventException } from '@prisma/client';
import { RecurrenceService } from './recurrence.service';

describe('RecurrenceService', () => {
  const service = new RecurrenceService();

  const baseEvent = {
    id: 'event-1',
    source_id: 'source-1',
    creator_id: 'user-1',
    title: 'Standup',
    description: null,
    start_at: new Date('2026-01-01T10:00:00.000Z'),
    end_at: new Date('2026-01-01T11:00:00.000Z'),
    all_day: false,
    timezone: 'UTC',
    location: null,
    rrule: 'FREQ=WEEKLY;COUNT=3',
    recurrence_parent_id: null,
    recurrence_exceptions: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    deleted_at: null,
    external_id: null,
    external_provider: null,
    external_etag: null,
    sync_status: 'local',
    last_synced_at: null,
  } as Event;

  const baseException = {
    id: 'exception-1',
    event_id: 'event-1',
    occurrence_at: new Date('2026-01-08T10:00:00.000Z'),
    is_deleted: false,
    title: null,
    description: null,
    start_at: null,
    end_at: null,
    all_day: null,
    timezone: null,
    location: null,
    rrule: null,
    external_etag: null,
    sync_status: 'local',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
  } as EventException;

  const range = {
    from: new Date('2026-01-01T00:00:00.000Z'),
    to: new Date('2026-02-01T00:00:00.000Z'),
  };

  it('раскрывает простое недельное правило', () => {
    const result = service.expand({
      event: baseEvent,
      exceptions: [],
      ...range,
    });

    expect(result.map((event) => event.start_at.toISOString())).toEqual([
      '2026-01-01T10:00:00.000Z',
      '2026-01-08T10:00:00.000Z',
      '2026-01-15T10:00:00.000Z',
    ]);
    expect(result[1].id).toBe(
      `event-1@${new Date('2026-01-08T10:00:00.000Z').getTime()}`,
    );
    expect(result[1].recurring_event_id).toBe('event-1');
    expect(result[1].original_start_at).toBe('2026-01-08T10:00:00.000Z');
  });

  it('возвращает вхождение, начавшееся до from, но пересекающее диапазон', () => {
    const result = service.expand({
      event: baseEvent,
      exceptions: [],
      from: new Date('2026-01-01T10:30:00.000Z'),
      to: new Date('2026-01-01T10:45:00.000Z'),
    });

    expect(result).toHaveLength(1);
    expect(result[0].start_at.toISOString()).toBe('2026-01-01T10:00:00.000Z');
  });

  it('исключает вхождение, начинающееся ровно в to', () => {
    const result = service.expand({
      event: baseEvent,
      exceptions: [],
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-01T10:00:00.000Z'),
    });

    expect(result).toHaveLength(0);
  });

  it('включает вхождение, начинающееся ровно в from', () => {
    const result = service.expand({
      event: baseEvent,
      exceptions: [],
      from: new Date('2026-01-01T10:00:00.000Z'),
      to: new Date('2026-01-01T10:05:00.000Z'),
    });

    expect(result).toHaveLength(1);
  });

  it('раскрывает правило в часовом поясе события', () => {
    const result = service.expand({
      event: {
        ...baseEvent,
        start_at: new Date('2026-01-01T07:00:00.000Z'),
        end_at: new Date('2026-01-01T08:00:00.000Z'),
        timezone: 'Europe/Moscow',
      },
      exceptions: [],
      ...range,
    });

    expect(result.map((event) => event.start_at.toISOString())).toEqual([
      '2026-01-01T07:00:00.000Z',
      '2026-01-08T07:00:00.000Z',
      '2026-01-15T07:00:00.000Z',
    ]);
  });

  it('сохраняет местное время при переходе на летнее время', () => {
    const result = service.expand({
      event: {
        ...baseEvent,
        start_at: new Date('2026-03-01T15:00:00.000Z'),
        end_at: new Date('2026-03-01T16:00:00.000Z'),
        timezone: 'America/New_York',
      },
      exceptions: [],
      from: new Date('2026-03-01T00:00:00.000Z'),
      to: new Date('2026-03-20T00:00:00.000Z'),
    });

    expect(result.map((event) => event.start_at.toISOString())).toEqual([
      '2026-03-01T15:00:00.000Z',
      '2026-03-08T14:00:00.000Z',
      '2026-03-15T14:00:00.000Z',
    ]);
  });

  it('пропускает удалённое вхождение', () => {
    const result = service.expand({
      event: baseEvent,
      exceptions: [{ ...baseException, is_deleted: true }],
      ...range,
    });

    expect(result.map((event) => event.start_at.toISOString())).toEqual([
      '2026-01-01T10:00:00.000Z',
      '2026-01-15T10:00:00.000Z',
    ]);
  });

  it('применяет переопределение вхождения', () => {
    const result = service.expand({
      event: baseEvent,
      exceptions: [
        {
          ...baseException,
          title: 'Перенесённый стендап',
          start_at: new Date('2026-01-08T12:00:00.000Z'),
          end_at: new Date('2026-01-08T13:30:00.000Z'),
          location: 'Онлайн',
        },
      ],
      ...range,
    });

    const moved = result.find(
      (event) =>
        event.id === `event-1@${baseException.occurrence_at.getTime()}`,
    );
    expect(moved?.title).toBe('Перенесённый стендап');
    expect(moved?.start_at.toISOString()).toBe('2026-01-08T12:00:00.000Z');
    expect(moved?.end_at.toISOString()).toBe('2026-01-08T13:30:00.000Z');
    expect(moved?.location).toBe('Онлайн');
    expect(moved?.original_start_at).toBe('2026-01-08T10:00:00.000Z');
  });

  it('добавляет вхождение, перенесённое в диапазон извне', () => {
    const result = service.expand({
      event: {
        ...baseEvent,
        rrule: 'FREQ=DAILY;COUNT=30',
      },
      exceptions: [
        {
          ...baseException,
          occurrence_at: new Date('2026-01-09T10:00:00.000Z'),
          start_at: new Date('2026-01-10T15:00:00.000Z'),
          end_at: new Date('2026-01-10T16:00:00.000Z'),
        },
      ],
      from: new Date('2026-01-10T14:00:00.000Z'),
      to: new Date('2026-01-10T17:00:00.000Z'),
    });

    expect(result).toHaveLength(1);
    expect(result[0].original_start_at).toBe('2026-01-09T10:00:00.000Z');
    expect(result[0].start_at.toISOString()).toBe('2026-01-10T15:00:00.000Z');
  });

  it('учитывает UNTIL', () => {
    const result = service.expand({
      event: { ...baseEvent, rrule: 'FREQ=DAILY;UNTIL=20260103T100000Z' },
      exceptions: [],
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-10T00:00:00.000Z'),
    });

    expect(result).toHaveLength(3);
  });

  it('учитывает COUNT', () => {
    const result = service.expand({
      event: { ...baseEvent, rrule: 'FREQ=DAILY;COUNT=2' },
      exceptions: [],
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-10T00:00:00.000Z'),
    });

    expect(result).toHaveLength(2);
  });

  it('возвращает событие с некорректным правилом как одиночное', () => {
    const result = service.expand({
      event: { ...baseEvent, rrule: 'NOT_A_RULE' },
      exceptions: [],
      ...range,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('event-1');
  });

  it('ограничивает число вхождений', () => {
    const result = service.expand({
      event: { ...baseEvent, rrule: 'FREQ=DAILY;COUNT=100' },
      exceptions: [],
      ...range,
      limit: 5,
    });

    expect(result).toHaveLength(5);
  });
});
