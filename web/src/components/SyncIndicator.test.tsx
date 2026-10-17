import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import { SyncIndicator } from '@/components/SyncIndicator';
import { useSyncStore } from '@/store/sync';

function renderIndicator() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <SyncIndicator />
    </QueryClientProvider>,
  );
}

describe('SyncIndicator', () => {
  beforeEach(() => {
    useSyncStore.setState({ status: 'idle' });
  });

  it('скрыт, когда синхронизация в порядке', () => {
    const { container } = renderIndicator();
    expect(container).toBeEmptyDOMElement();
  });

  it('показывает ошибку синхронизации', () => {
    useSyncStore.setState({ status: 'error' });
    renderIndicator();
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'Ошибка синхронизации',
    );
  });
});
