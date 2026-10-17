import { describe, expect, it, vi } from 'vitest';
import {
  buildOnboardingSteps,
  dismissOnboarding,
  isOnboardingComplete,
  isOnboardingDismissed,
  ONBOARDING_DISMISS_KEY,
} from '@/lib/onboarding';

describe('buildOnboardingSteps', () => {
  it('возвращает три шага, все незавершённые при пустых данных', () => {
    const steps = buildOnboardingSteps({
      spacesCount: 0,
      hasToken: false,
      hasEvent: false,
    });
    expect(steps.map((s) => s.key)).toEqual(['space', 'token', 'event']);
    expect(steps.every((s) => !s.done)).toBe(true);
  });

  it('отмечает выполненные шаги по прогрессу', () => {
    const steps = buildOnboardingSteps({
      spacesCount: 1,
      hasToken: true,
      hasEvent: false,
    });
    expect(steps.find((s) => s.key === 'space')?.done).toBe(true);
    expect(steps.find((s) => s.key === 'token')?.done).toBe(true);
    expect(steps.find((s) => s.key === 'event')?.done).toBe(false);
  });

  it('шаг токена ведёт на /tokens, шаг события — на /calendar', () => {
    const steps = buildOnboardingSteps({
      spacesCount: 0,
      hasToken: false,
      hasEvent: false,
    });
    expect(steps.find((s) => s.key === 'token')?.to).toBe('/tokens');
    expect(steps.find((s) => s.key === 'event')?.to).toBe('/calendar');
    expect(steps.find((s) => s.key === 'space')?.to).toBeNull();
  });
});

describe('isOnboardingComplete', () => {
  it('истинно, когда все шаги выполнены', () => {
    const steps = buildOnboardingSteps({
      spacesCount: 1,
      hasToken: true,
      hasEvent: true,
    });
    expect(isOnboardingComplete(steps)).toBe(true);
  });

  it('ложно, пока есть незавершённый шаг', () => {
    const steps = buildOnboardingSteps({
      spacesCount: 1,
      hasToken: false,
      hasEvent: false,
    });
    expect(isOnboardingComplete(steps)).toBe(false);
  });
});

describe('dismissOnboarding', () => {
  it('пишет и читает флаг скрытия из хранилища', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    };

    expect(isOnboardingDismissed(storage)).toBe(false);
    dismissOnboarding(storage);
    expect(storage.setItem).toHaveBeenCalledWith(ONBOARDING_DISMISS_KEY, '1');
    expect(isOnboardingDismissed(storage)).toBe(true);
  });
});
