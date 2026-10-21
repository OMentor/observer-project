import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictIndicator } from '@/features/sync/ConflictIndicator';
import { makeConflict } from '@/features/sync/fixtures';
import { fetchConflicts } from '@/lib/services';

vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services')>();
  return { ...actual, fetchConflicts: vi.fn() };
});

const mocked = vi.mocked(fetchConflicts);

function renderIndicator() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConflictIndicator />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ConflictIndicator', () => {
  beforeEach(() => mocked.mockReset());

  it('скрыт, когда конфликтов нет', async () => {
    mocked.mockResolvedValue({ items: [], limit: 50, offset: 0 });
    const { container } = renderIndicator();
    await vi.waitFor(() => expect(mocked).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('показывает количество конфликтов', async () => {
    mocked.mockResolvedValue({
      items: [makeConflict(), makeConflict({ id: 'conflict-2' })],
      limit: 50,
      offset: 0,
    });
    renderIndicator();
    expect(
      await screen.findByRole('button', {
        name: 'Конфликты синхронизации: 2',
      }),
    ).toBeInTheDocument();
  });
});
