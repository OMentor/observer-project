import {
  createEventSchema,
  deleteEventSchema,
  updateEventSchema,
} from './events.dto';

const base = {
  title: 'Созвон',
  start_at: '2026-01-01T10:00:00.000Z',
  end_at: '2026-01-01T11:00:00.000Z',
};

describe('createEventSchema', () => {
  it('принимает корректное RRULE-правило', () => {
    const result = createEventSchema.safeParse({
      ...base,
      rrule: 'FREQ=WEEKLY;BYDAY=TU;COUNT=6',
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.rrule).toBe(
      'FREQ=WEEKLY;BYDAY=TU;COUNT=6',
    );
  });

  it('отклоняет несуществующую частоту', () => {
    const result = createEventSchema.safeParse({
      ...base,
      rrule: 'FREQ=BANANA',
    });

    expect(result.success).toBe(false);
  });

  it('отклоняет мусор вместо правила', () => {
    const result = createEventSchema.safeParse({
      ...base,
      rrule: 'каждый вторник',
    });

    expect(result.success).toBe(false);
  });

  it('разрешает событие без правила повторения', () => {
    const result = createEventSchema.safeParse(base);

    expect(result.success).toBe(true);
  });
});

describe('updateEventSchema', () => {
  it('требует occurrence_at при scope=single', () => {
    const result = updateEventSchema.safeParse({ scope: 'single' });

    expect(result.success).toBe(false);
  });

  it('принимает scope=single с occurrence_at', () => {
    const result = updateEventSchema.safeParse({
      scope: 'single',
      occurrence_at: '2026-01-08T10:00:00.000Z',
      title: 'Перенесено',
    });

    expect(result.success).toBe(true);
  });

  it('отклоняет некорректное RRULE-правило', () => {
    const result = updateEventSchema.safeParse({ rrule: 'FREQ=BANANA' });

    expect(result.success).toBe(false);
  });
});

describe('deleteEventSchema', () => {
  it('требует occurrence_at при scope=single', () => {
    const result = deleteEventSchema.safeParse({ scope: 'single' });

    expect(result.success).toBe(false);
  });

  it('разрешает удаление всей серии без occurrence_at', () => {
    const result = deleteEventSchema.safeParse({ scope: 'all' });

    expect(result.success).toBe(true);
  });
});
