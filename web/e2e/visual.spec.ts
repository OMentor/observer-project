import { test, expect, type Page } from '@playwright/test';

const DEMO_EMAIL = 'demo@pletenie.local';
const DEMO_PASSWORD = 'demo12345';

/** Fixed "today" so the calendar and date labels are deterministic. */
const FIXED_TIME = new Date('2026-10-15T12:00:00+03:00');

const THEMES = ['dark', 'light'] as const;
type Theme = (typeof THEMES)[number];

const PAGES: { name: string; path: string; heading: RegExp }[] = [
  { name: 'spaces', path: '/', heading: /Пространства/ },
  { name: 'calendar', path: '/calendar', heading: /Сводный календарь/ },
  { name: 'tokens', path: '/tokens', heading: /Токены/ },
  { name: 'members', path: '/members', heading: /Участники/ },
  { name: 'history', path: '/history', heading: /История/ },
  { name: 'settings', path: '/settings', heading: /Настройки/ },
  { name: 'profile', path: '/profile', heading: /Профиль/ },
];

async function applyTheme(page: Page, theme: Theme) {
  await page.addInitScript((value: string) => {
    localStorage.setItem(
      'pletenie.theme',
      JSON.stringify({ state: { theme: value }, version: 0 }),
    );
  }, theme);
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(DEMO_EMAIL);
  await page.getByLabel('Пароль').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(
    page.getByRole('heading', { name: 'Пространства' }),
  ).toBeVisible();
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

test.describe('Плетение · visual regression', () => {
  for (const theme of THEMES) {
    test.describe(theme, () => {
      test.use({ viewport: { width: 1440, height: 900 } });

      test(`login (${theme})`, async ({ page }) => {
        await page.clock.setFixedTime(FIXED_TIME);
        await applyTheme(page, theme);
        await page.goto('/login');
        await expect(
          page.getByRole('heading', { name: 'Плетение' }),
        ).toBeVisible();
        await settle(page);
        await expect(page).toHaveScreenshot(`${theme}-login.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });

      for (const target of PAGES) {
        test(`${target.name} (${theme})`, async ({ page }) => {
          await page.clock.setFixedTime(FIXED_TIME);
          await applyTheme(page, theme);
          await login(page);
          if (target.path !== '/') {
            await page.goto(target.path);
          }
          await expect(
            page.getByRole('heading', { name: target.heading }).first(),
          ).toBeVisible();
          if (target.name === 'spaces') {
            await page
              .getByTestId('onboarding')
              .waitFor({ state: 'visible', timeout: 3000 })
              .catch(() => undefined);
          }
          await settle(page);
          await expect(page).toHaveScreenshot(`${theme}-${target.name}.png`, {
            fullPage: true,
            animations: 'disabled',
            mask: [page.getByRole('status')],
            maxDiffPixelRatio: 0.02,
          });
        });
      }
    });
  }
});
