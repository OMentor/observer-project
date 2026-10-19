import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarEvent, Source } from '@/lib/types';
import { QuarterView } from '@/features/calendar/views/quarter/QuarterView';

const sources: Source[] = [
  {
    id: 's1',
    space_id: 'sp1',
    owner_id: 'u1',
    name: 'Работа',
    color: '#5B5FEF',
    visibility: 'SHARED',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

function makeEvent(id: string, start: Date): CalendarEvent {
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
  };
}

describe('QuarterView', () => {
  it('renders a four-month window and opens the day panel on click', async () => {
    render(
      <QuarterView
        events={[makeEvent('a', new Date(2026, 9, 15, 9))]}
        sources={sources}
        initialDate={new Date(2026, 9, 1)}
      />,
    );
    expect(screen.getByText('окт. 2026 – янв. 2027')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Январь 2027' }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /15 Октябрь 2026/ }),
    );
    expect(screen.getByText('Event a')).toBeInTheDocument();
  });

  it('toggles busy-only and hide-weekends filters', async () => {
    render(
      <QuarterView events={[]} sources={sources} initialDate={new Date(2026, 9, 1)} />,
    );
    const busy = screen.getByRole('button', { name: 'Только занятость' });
    const weekends = screen.getByRole('button', { name: 'Скрыть выходные' });
    expect(busy).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(busy);
    await userEvent.click(weekends);
    expect(busy).toHaveAttribute('aria-pressed', 'true');
    expect(weekends).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders a twelve-month year window and steps by year', async () => {
    const onRangeChange = vi.fn();
    render(
      <QuarterView
        events={[makeEvent('a', new Date(2026, 9, 15, 9))]}
        sources={sources}
        initialDate={new Date(2026, 9, 15)}
        monthsCount={12}
        onRangeChange={onRangeChange}
      />,
    );
    expect(
      screen.getAllByRole('button', { name: /^[А-Яа-я]+ 2026$/ }),
    ).toHaveLength(12);
    const combo = screen.getByRole('combobox', { name: 'Переход к году' });
    expect(combo).toHaveValue('2026');

    expect(onRangeChange).toHaveBeenCalledWith({
      start: new Date(2026, 0, 1),
      end: new Date(2027, 0, 1),
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Следующий год' }),
    );
    expect(combo).toHaveValue('2027');
    expect(
      screen.getAllByRole('button', { name: /^[А-Яа-я]+ 2027$/ }),
    ).toHaveLength(12);

    await userEvent.click(
      screen.getByRole('button', { name: 'Предыдущий год' }),
    );
    expect(combo).toHaveValue('2026');
  });

  it('navigates to the month view', async () => {
    const onOpenMonth = vi.fn();
    render(
      <QuarterView
        events={[]}
        sources={sources}
        initialDate={new Date(2026, 9, 1)}
        onOpenMonth={onOpenMonth}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Октябрь 2026' }));
    expect(onOpenMonth).toHaveBeenCalledWith(new Date(2026, 9, 1));
  });
});
