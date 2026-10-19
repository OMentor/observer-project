import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuarterGrid } from '@/features/calendar/views/quarter/QuarterGrid';

const months = [
  new Date(2026, 9, 1),
  new Date(2026, 10, 1),
  new Date(2026, 11, 1),
  new Date(2027, 0, 1),
];

describe('QuarterGrid', () => {
  it('renders one mini month per month in the window', () => {
    render(
      <QuarterGrid
        months={months}
        eventsByDay={new Map()}
        colorBySource={new Map()}
        today={new Date(2026, 9, 15)}
        onSelectDay={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Октябрь 2026' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Январь 2027' }),
    ).toBeInTheDocument();
  });

  it('lays out all twelve months in a three-column grid', () => {
    const yearMonths = Array.from(
      { length: 12 },
      (_, index) => new Date(2026, index, 1),
    );
    const { container } = render(
      <QuarterGrid
        months={yearMonths}
        eventsByDay={new Map()}
        colorBySource={new Map()}
        today={new Date(2026, 9, 15)}
        onSelectDay={vi.fn()}
      />,
    );
    expect(
      screen.getAllByRole('button', { name: /^[А-Яа-я]+ 2026$/ }),
    ).toHaveLength(12);
    const grid = container.firstElementChild;
    expect(grid?.className).toContain('lg:grid-cols-3');
    expect(grid?.className).not.toContain('xl:grid-cols-4');
  });
});
