import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuarterToolbar } from '@/features/calendar/views/quarter/QuarterToolbar';

const options = [
  { key: 'Q3 2026', start: new Date(2026, 6, 1) },
  { key: 'Q4 2026', start: new Date(2026, 9, 1) },
  { key: 'Q1 2027', start: new Date(2027, 0, 1) },
];

describe('QuarterToolbar', () => {
  it('renders the window label and navigation', async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToday = vi.fn();
    render(
      <QuarterToolbar
        label="окт. 2026 – янв. 2027"
        value="Q4 2026"
        options={options}
        onChange={vi.fn()}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />,
    );
    expect(screen.getByText('окт. 2026 – янв. 2027')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Предыдущий квартал' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Следующий квартал' }),
    );
    await userEvent.click(screen.getByRole('button', { name: /Сегодня/ }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onToday).toHaveBeenCalledTimes(1);
  });

  it('reports the chosen quarter', async () => {
    const onChange = vi.fn();
    render(
      <QuarterToolbar
        label="окт. 2026 – янв. 2027"
        value="Q4 2026"
        options={options}
        onChange={onChange}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onToday={vi.fn()}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Переход к кварталу' }),
      'Q1 2027',
    );
    expect(onChange).toHaveBeenCalledWith('Q1 2027');
  });
});
