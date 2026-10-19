import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DayCell } from '@/features/calendar/views/quarter/DayCell';
import { densityLevel } from '@/features/calendar/lib/density';

describe('DayCell', () => {
  const base = {
    date: new Date(2026, 9, 15),
    inMonth: true,
    isToday: false,
    isWeekend: false,
    isSelected: false,
    count: 0,
    level: densityLevel(0),
    colors: [],
    onSelect: vi.fn(),
  };

  it('shows the day number and reports selection', async () => {
    const onSelect = vi.fn();
    render(<DayCell {...base} label="15 октября" onSelect={onSelect} />);
    const cell = screen.getByRole('button', { name: '15 октября' });
    expect(cell).toHaveTextContent('15');
    await userEvent.click(cell);
    expect(onSelect).toHaveBeenCalledWith(base.date);
  });

  it('marks today with aria-current', () => {
    render(<DayCell {...base} isToday label="15 октября" />);
    expect(screen.getByRole('button', { name: '15 октября' })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('reports a dropped day when a drop handler is provided', () => {
    const onDropDay = vi.fn();
    render(<DayCell {...base} label="15 октября" onDropDay={onDropDay} />);
    const cell = screen.getByRole('button', { name: '15 октября' });
    fireEvent.dragOver(cell, { dataTransfer: { dropEffect: '' } });
    fireEvent.drop(cell, { dataTransfer: {} });
    expect(onDropDay).toHaveBeenCalledWith(base.date);
  });

  it('hides dots when the day is outside the month', () => {
    render(
      <DayCell
        {...base}
        inMonth={false}
        count={4}
        colors={['#f00', '#0f0', '#00f', '#ff0']}
        label="30 сентября"
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
