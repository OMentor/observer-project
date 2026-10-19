import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarEvent } from '@/lib/types';
import { DayDetailPanel } from '@/features/calendar/views/quarter/DayDetailPanel';
import {
  dayTitle,
  groupDaySections,
} from '@/features/calendar/lib/daySections';

function makeEvent(
  id: string,
  start: Date,
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent {
  return {
    id,
    source_id: 's1',
    creator_id: 'u1',
    title: `Event ${id}`,
    description: null,
    start_at: start.toISOString(),
    end_at: new Date(start.getTime() + 3_600_000).toISOString(),
    all_day: false,
    timezone: 'UTC',
    location: null,
    rrule: null,
    created_at: start.toISOString(),
    updated_at: start.toISOString(),
    ...overrides,
  };
}

const colorBySource = new Map([['s1', '#abcdef']]);

describe('groupDaySections', () => {
  it('splits events into time-of-day sections', () => {
    const sections = groupDaySections([
      makeEvent('a', new Date(2026, 9, 15, 9)),
      makeEvent('b', new Date(2026, 9, 15, 13)),
      makeEvent('c', new Date(2026, 9, 15, 19)),
      makeEvent('d', new Date(2026, 9, 15, 0), { all_day: true }),
    ]);
    expect(sections.map((section) => section.id)).toEqual([
      'allDay',
      'morning',
      'day',
      'evening',
    ]);
    expect(sections[0].events).toHaveLength(1);
  });

  it('omits empty sections', () => {
    const sections = groupDaySections([
      makeEvent('a', new Date(2026, 9, 15, 9)),
    ]);
    expect(sections.map((section) => section.id)).toEqual(['morning']);
  });
});

describe('DayDetailPanel', () => {
  it('asks to pick a day when none is selected', () => {
    render(
      <DayDetailPanel date={null} events={[]} colorBySource={colorBySource} />,
    );
    expect(screen.getByText('Выберите день, чтобы увидеть события.')).toBeInTheDocument();
  });

  it('shows the day title and events', () => {
    const date = new Date(2026, 9, 15);
    render(
      <DayDetailPanel
        date={date}
        events={[makeEvent('a', new Date(2026, 9, 15, 9))]}
        colorBySource={colorBySource}
      />,
    );
    expect(screen.getByText(dayTitle(date))).toBeInTheDocument();
    expect(screen.getByText('Event a')).toBeInTheDocument();
    expect(screen.getByText('Утро')).toBeInTheDocument();
  });

  it('masks busy events', () => {
    const date = new Date(2026, 9, 15);
    render(
      <DayDetailPanel
        date={date}
        events={[makeEvent('a', new Date(2026, 9, 15, 9), { busy: true })]}
        colorBySource={colorBySource}
      />,
    );
    expect(screen.getByText('Занято')).toBeInTheDocument();
  });

  it('shows an empty state for a day without events', () => {
    render(
      <DayDetailPanel
        date={new Date(2026, 9, 15)}
        events={[]}
        colorBySource={colorBySource}
      />,
    );
    expect(screen.getByText('В этот день событий нет.')).toBeInTheDocument();
  });

  it('shows an error state', () => {
    render(
      <DayDetailPanel
        date={new Date(2026, 9, 15)}
        events={[]}
        colorBySource={colorBySource}
        error
      />,
    );
    expect(screen.getByText('Не удалось загрузить события.')).toBeInTheDocument();
  });

  it('exposes draggable events when a move handler is provided', () => {
    const onDragEvent = vi.fn();
    const event = makeEvent('a', new Date(2026, 9, 15, 9));
    render(
      <DayDetailPanel
        date={new Date(2026, 9, 15)}
        events={[event]}
        colorBySource={colorBySource}
        onDragEvent={onDragEvent}
      />,
    );
    const item = screen.getByRole('button', { name: /Event a/ });
    expect(item).toHaveAttribute('draggable', 'true');
    fireEvent.dragStart(item, {
      dataTransfer: { setData: vi.fn(), effectAllowed: '' },
    });
    expect(onDragEvent).toHaveBeenCalledWith(event);
  });

  it('offers to add an event', async () => {
    const onAddEvent = vi.fn();
    const date = new Date(2026, 9, 15);
    render(
      <DayDetailPanel
        date={date}
        events={[]}
        colorBySource={colorBySource}
        onAddEvent={onAddEvent}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Добавить событие/ }),
    );
    expect(onAddEvent).toHaveBeenCalledWith(date);
  });
});
