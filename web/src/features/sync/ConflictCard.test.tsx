import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConflictCard } from '@/features/sync/ConflictCard';
import { makeConflict } from '@/features/sync/fixtures';

describe('ConflictCard', () => {
  it('показывает заголовок и различия полей', () => {
    render(
      <ConflictCard
        conflict={makeConflict()}
        sourceLabel="Работа / Команда"
        onResolve={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Встреча с клиентом' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Работа / Команда')).toBeInTheDocument();
    expect(screen.getByText('Встреча с Аней')).toBeInTheDocument();
    expect(screen.getByText('Офис')).toBeInTheDocument();
  });

  it('передаёт конфликт при нажатии «Разрешить»', async () => {
    const onResolve = vi.fn();
    const conflict = makeConflict();
    render(<ConflictCard conflict={conflict} onResolve={onResolve} />);

    await userEvent.click(screen.getByRole('button', { name: 'Разрешить' }));
    expect(onResolve).toHaveBeenCalledWith(conflict);
  });
});
