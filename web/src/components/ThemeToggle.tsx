import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeMode } from '@/store/theme';

const LABELS: Record<ThemeMode, string> = {
  dark: 'Тёмная тема',
  light: 'Светлая тема',
  system: 'Системная тема',
};

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${LABELS[theme]}. Переключить тему`}
      title={LABELS[theme]}
      className="inline-flex size-10 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 ease-out-expo hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
    >
      <Icon className="size-5" />
    </button>
  );
}
