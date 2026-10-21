import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictResolveDialog } from '@/features/sync/ConflictResolveDialog';
import { axiosStatusError, makeConflict } from '@/features/sync/fixtures';
import { resolveConflict } from '@/lib/services';
import { useToastStore } from '@/store/toasts';

vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services')>();
  return { ...actual, resolveConflict: vi.fn() };
});

const mocked = vi.mocked(resolveConflict);

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ConflictResolveDialog
        conflict={makeConflict()}
        open
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>,
  );
  return onOpenChange;
}

function toastTitles(): string[] {
  return useToastStore.getState().toasts.map((toast) => toast.title);
}

describe('ConflictResolveDialog', () => {
  beforeEach(() => {
    mocked.mockReset();
    useToastStore.setState({ toasts: [] });
  });

  it('разрешает в пользу локальной версии', async () => {
    mocked.mockResolvedValue({} as never);
    const onOpenChange = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Наша версия' }));

    await vi.waitFor(() =>
      expect(mocked).toHaveBeenCalledWith('conflict-1', {
        resolution: 'local',
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('разрешает в пользу внешней версии', async () => {
    mocked.mockResolvedValue({} as never);
    renderDialog();

    await userEvent.click(
      screen.getByRole('button', { name: 'Внешняя версия' }),
    );

    await vi.waitFor(() =>
      expect(mocked).toHaveBeenCalledWith('conflict-1', {
        resolution: 'external',
      }),
    );
  });

  it('объединяет поля и отправляет merged_data', async () => {
    mocked.mockResolvedValue({} as never);
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Объединить' }));
    await userEvent.click(
      screen.getByRole('radio', { name: 'Название: внешняя' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await vi.waitFor(() => expect(mocked).toHaveBeenCalled());
    expect(mocked.mock.calls[0][1]).toEqual({
      resolution: 'merged',
      merged_data: { title: 'Встреча с Аней' },
    });
  });

  it('не даёт сохранить пустое «своё» название', async () => {
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Объединить' }));
    await userEvent.click(
      screen.getByRole('radio', { name: 'Название: своё' }),
    );
    await userEvent.clear(
      screen.getByRole('textbox', { name: 'Название: своё значение' }),
    );

    expect(
      screen.getByText('Название не может быть пустым.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled();
    expect(mocked).not.toHaveBeenCalled();
  });

  it('обрабатывает 409 «конфликт уже разрешён»', async () => {
    mocked.mockRejectedValue(axiosStatusError(409));
    const onOpenChange = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Наша версия' }));

    await vi.waitFor(() =>
      expect(onOpenChange).toHaveBeenCalledWith(false),
    );
    expect(toastTitles()).toContain('Конфликт уже разрешён');
  });

  it('показывает ошибку при недоступном внешнем календаре (503)', async () => {
    mocked.mockRejectedValue(axiosStatusError(503));
    const onOpenChange = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Наша версия' }));

    await vi.waitFor(() =>
      expect(toastTitles()).toContain('Не удалось записать изменения'),
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
