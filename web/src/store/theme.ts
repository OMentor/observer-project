import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light' | 'system';

type ThemeState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggle: () => void;
};

const ORDER: ThemeMode[] = ['dark', 'light', 'system'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggle: () =>
        set({ theme: ORDER[(ORDER.indexOf(get().theme) + 1) % ORDER.length] }),
    }),
    { name: 'pletenie.theme' },
  ),
);

export function resolveDark(theme: ThemeMode): boolean {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return theme === 'dark';
}

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const dark = resolveDark(theme);
  root.classList.toggle('dark', dark);
  root.classList.toggle('light', !dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}
