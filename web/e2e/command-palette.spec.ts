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

test.describe('Плетение · командная палитра', () => {
  test('открывается по Ctrl+K и переходит по разделу', async ({ page }) => {
    await login(page);

    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Введите команду или поиск…');
    await expect(input).toBeVisible();

    await page.getByRole('option', { name: 'Настройки' }).click();
    await expect(
      page.getByRole('heading', { name: 'Настройки пространства' }),
    ).toBeVisible();
  });

  test('фильтрует команды и показывает пустой результат', async ({ page }) => {
    await login(page);

    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Введите команду или поиск…');
    await input.fill('Участники');
    await expect(page.getByRole('option', { name: 'Участники' })).toBeVisible();

    await input.fill('__нет_такой_команды__');
    await expect(page.getByText('Ничего не найдено')).toBeVisible();
  });
});
