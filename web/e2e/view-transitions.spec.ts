import { test, expect, type Page } from '@playwright/test';

const DEMO_EMAIL = 'demo@pletenie.local';
const DEMO_PASSWORD = 'demo12345';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(DEMO_EMAIL);
  await page.getByLabel('Пароль').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(
    page.getByRole('heading', { name: 'Пространства' }),
  ).toBeVisible();
}

async function trackViewTransitions(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __vtCalls: number }).__vtCalls = 0;
    const original = document.startViewTransition;
    if (typeof original === 'function') {
      document.startViewTransition = function (
        callback: () => void | Promise<void>,
      ) {
        (window as unknown as { __vtCalls: number }).__vtCalls += 1;
        return original.call(document, callback);
      } as typeof document.startViewTransition;
    }
  });
}

async function navigateViaPalette(page: Page) {
  await page.keyboard.press('Control+k');
  const input = page.getByPlaceholder('Введите команду или поиск…');
  await input.fill('Календарь');
  await page.getByRole('option', { name: 'Календарь' }).click();
  await expect(page).toHaveURL(/\/calendar$/);
}

test.describe('Плетение · переходы страниц', () => {
  test('использует View Transitions при обычном режиме', async ({ page }) => {
    await trackViewTransitions(page);
    await login(page);
    await navigateViaPalette(page);

    const calls = await page.evaluate(
      () => (window as unknown as { __vtCalls: number }).__vtCalls,
    );
    expect(calls).toBeGreaterThan(0);
  });

  test('не запускает переходы при prefers-reduced-motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await trackViewTransitions(page);
    await login(page);
    await navigateViaPalette(page);

    const calls = await page.evaluate(
      () => (window as unknown as { __vtCalls: number }).__vtCalls,
    );
    expect(calls).toBe(0);
  });
});
