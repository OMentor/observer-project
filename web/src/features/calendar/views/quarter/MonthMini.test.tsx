import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarEvent } from '@/lib/types';
import { MonthMini } from '@/features/calendar/views/quarter/MonthMini';
import { groupEventsByDay } from '@/features/calendar/lib/density';

function makeEvent(id: string, start: Date, sourceId = 's1'): CalendarEvent {
  return {
    id,
    source_id: sourceId,
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
  };
}

const colorBySource = new Map([['s1', '#abcdef']]);

describe('MonthMini', () => {
  it('renders the month header and day grid', () => {
    render(
      <MonthMini
        month={new Date(2026, 9, 1)}
        eventsByDay={new Map()}
        colorBySource={colorBySource}
        today={new Date(2026, 9, 15)}
        onSelectDay={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Октябрь 2026' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /15 Октябрь 2026/ }),
    ).toBeInTheDocument();
  });

  it('reports a selected day', async () => {
    const onSelectDay = vi.fn();
    render(
      <MonthMini
        month={new Date(2026, 9, 1)}
        eventsByDay={groupEventsByDay([makeEvent('a', new Date(2026, 9, 15, 9))])}
        colorBySource={colorBySource}
        today={new Date(2026, 9, 15)}
        onSelectDay={onSelectDay}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /15 Октябрь 2026/ }),
    );
    expect(onSelectDay).toHaveBeenCalled();
  });

  it('reports a month selection from the header', async () => {
    const onSelectMonth = vi.fn();
    render(
      <MonthMini
        month={new Date(2026, 9, 1)}
        eventsByDay={new Map()}
        colorBySource={colorBySource}
        today={new Date(2026, 9, 15)}
        onSelectDay={vi.fn()}
        onSelectMonth={onSelectMonth}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Октябрь 2026' }));
    expect(onSelectMonth).toHaveBeenCalledWith(new Date(2026, 9, 1));
  });

  it('hides weekend columns when asked', () => {
    const { container } = render(
      <MonthMini
        month={new Date(2026, 9, 1)}
        eventsByDay={new Map()}
        colorBySource={colorBySource}
        today={new Date(2026, 9, 15)}
        hideWeekends
        onSelectDay={vi.fn()}
      />,
    );
    expect(screen.queryByText('Сб')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.grid-cols-5').length).toBeGreaterThan(0);
  });
});
