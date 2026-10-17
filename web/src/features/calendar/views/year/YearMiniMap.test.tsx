import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarEvent } from '@/lib/types';
import { YearMiniMap } from '@/features/calendar/views/year/YearMiniMap';

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

describe('YearMiniMap', () => {
  it('renders the year and month labels', () => {
    render(
      <YearMiniMap
        year={2026}
        events={[]}
        onSelectMonth={vi.fn()}
        onPrevYear={vi.fn()}
        onNextYear={vi.fn()}
      />,
    );
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('янв')).toBeInTheDocument();
    expect(screen.getByText('дек')).toBeInTheDocument();
  });

  it('marks the current month', () => {
    render(
      <YearMiniMap
        year={2026}
        events={[]}
        today={new Date(2026, 9, 15)}
        onSelectMonth={vi.fn()}
        onPrevYear={vi.fn()}
        onNextYear={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'окт 2026' })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('reports the selected month', async () => {
    const onSelectMonth = vi.fn();
    render(
      <YearMiniMap
        year={2026}
        events={[]}
        onSelectMonth={onSelectMonth}
        onPrevYear={vi.fn()}
        onNextYear={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'мар 2026' }));
    expect(onSelectMonth).toHaveBeenCalledWith(new Date(2026, 2, 1));
  });

  it('navigates between years', async () => {
    const onPrevYear = vi.fn();
    const onNextYear = vi.fn();
    render(
      <YearMiniMap
        year={2026}
        events={[]}
        onSelectMonth={vi.fn()}
        onPrevYear={onPrevYear}
        onNextYear={onNextYear}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Предыдущий год' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Следующий год' }),
    );
    expect(onPrevYear).toHaveBeenCalledTimes(1);
    expect(onNextYear).toHaveBeenCalledTimes(1);
  });

  it('ignores events from other years', () => {
    render(
      <YearMiniMap
        year={2026}
        events={[makeEvent('a', new Date(2025, 0, 1))]}
        onSelectMonth={vi.fn()}
        onPrevYear={vi.fn()}
        onNextYear={vi.fn()}
      />,
    );
    expect(screen.getByText('2026')).toBeInTheDocument();
  });
});
