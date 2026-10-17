import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildOnboardingSteps } from '@/lib/onboarding';
import { OnboardingChecklist } from '@/features/onboarding/OnboardingChecklist';

function renderChecklist(options?: {
  onCreateSpace?: () => void;
  onDismiss?: () => void;
  spacesCount?: number;
  hasToken?: boolean;
  hasEvent?: boolean;
}) {
  const onCreateSpace = options?.onCreateSpace ?? vi.fn();
  const onDismiss = options?.onDismiss ?? vi.fn();
  const steps = buildOnboardingSteps({
    spacesCount: options?.spacesCount ?? 1,
    hasToken: options?.hasToken ?? false,
    hasEvent: options?.hasEvent ?? false,
  });
  render(
    <MemoryRouter>
      <OnboardingChecklist
        steps={steps}
        onCreateSpace={onCreateSpace}
        onDismiss={onDismiss}
      />
    </MemoryRouter>,
  );
  return { onCreateSpace, onDismiss };
}

describe('OnboardingChecklist', () => {
  it('показывает все три шага', () => {
    renderChecklist();
    expect(screen.getByText('Создайте пространство')).toBeInTheDocument();
    expect(
      screen.getByText('Пригласите участника по токену'),
    ).toBeInTheDocument();
    expect(screen.getByText('Создайте первое событие')).toBeInTheDocument();
  });

  it('активным считается первый незавершённый шаг', () => {
    renderChecklist({ spacesCount: 1, hasToken: false });
    expect(screen.getByTestId('onboarding-step-space')).toHaveAttribute(
      'data-done',
      'true',
    );
    const tokenStep = screen.getByTestId('onboarding-step-token');
    expect(tokenStep).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Создать токен')).toBeInTheDocument();
  });

  it('CTA активного шага без ссылки вызывает onCreateSpace', async () => {
    const { onCreateSpace } = renderChecklist({ spacesCount: 0 });
    await userEvent.click(screen.getByText('Создать пространство'));
    expect(onCreateSpace).toHaveBeenCalledTimes(1);
  });

  it('кнопка скрытия вызывает onDismiss', async () => {
    const { onDismiss } = renderChecklist();
    await userEvent.click(
      screen.getByRole('button', { name: 'Скрыть подсказки' }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
