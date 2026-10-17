import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette } from '@/components/CommandPalette';

vi.mock('@/lib/services', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/services')>('@/lib/services');
  return { ...actual, fetchSpaces: vi.fn().mockResolvedValue([]) };
});

function renderPalette(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CommandPalette open onOpenChange={onOpenChange} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onOpenChange;
}

describe('CommandPalette', () => {
  it('renders navigation and action groups', () => {
    renderPalette();
    expect(screen.getByText('Календарь')).toBeInTheDocument();
    expect(screen.getByText('Тёмная тема')).toBeInTheDocument();
    expect(screen.getByText('Навигация')).toBeInTheDocument();
    expect(screen.getByText('Действия')).toBeInTheDocument();
  });

  it('closes when an item is selected', async () => {
    const onOpenChange = renderPalette();
    await userEvent.click(screen.getByText('Календарь'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the empty state when nothing matches', async () => {
    renderPalette();
    await userEvent.type(
      screen.getByPlaceholderText('Введите команду или поиск…'),
      'zzzzz',
    );
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });
});
