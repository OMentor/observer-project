export type OnboardingStepKey = 'space' | 'token' | 'event';

export interface OnboardingStep {
  key: OnboardingStepKey;
  title: string;
  description: string;
  cta: string;
  /** `null` означает действие внутри текущей страницы (создание пространства). */
  to: string | null;
  done: boolean;
}

export interface OnboardingProgress {
  spacesCount: number;
  hasToken: boolean;
  hasEvent: boolean;
}

/** Три шага первого запуска: пространство → токен → первое событие. */
export function buildOnboardingSteps(
  progress: OnboardingProgress,
): OnboardingStep[] {
  return [
    {
      key: 'space',
      title: 'Создайте пространство',
      description:
        'Пространство — общий календарь для команды, семьи или проекта.',
      cta: 'Создать пространство',
      to: null,
      done: progress.spacesCount > 0,
    },
    {
      key: 'token',
      title: 'Пригласите участника по токену',
      description:
        'Выдайте токен и отправьте ссылку — участник войдёт с нужными правами.',
      cta: 'Создать токен',
      to: '/tokens',
      done: progress.hasToken,
    },
    {
      key: 'event',
      title: 'Создайте первое событие',
      description: 'Добавьте событие, чтобы увидеть его в календаре.',
      cta: 'Открыть календарь',
      to: '/calendar',
      done: progress.hasEvent,
    },
  ];
}

export function isOnboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.every((step) => step.done);
}

export const ONBOARDING_DISMISS_KEY = 'pletene:onboarding:dismissed';

type MinimalStorage = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): MinimalStorage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function isOnboardingDismissed(storage = defaultStorage()): boolean {
  return storage?.getItem(ONBOARDING_DISMISS_KEY) === '1';
}

export function dismissOnboarding(storage = defaultStorage()): void {
  storage?.setItem(ONBOARDING_DISMISS_KEY, '1');
}
