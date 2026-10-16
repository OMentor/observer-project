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

async function currentTheme(page: Page): Promise<'dark' | 'light'> {
  const cls = await page.locator('html').getAttribute('class');
  return (cls ?? '').split(/\s+/).includes('dark') ? 'dark' : 'light';
}

test.describe('Плетение · UI smoke', () => {
  test('вход демо-пользователем открывает пространства', async ({ page }) => {
    await login(page);
    await expect(page.getByText('Demo')).toBeVisible();
  });

  test('переключатель темы в шапке меняет тему и сохраняется', async ({
    page,
  }) => {
    await login(page);
    await expect(await currentTheme(page)).toBe('light');

    await page.getByRole('button', { name: 'Тёмная тема' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Пространства' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('профиль: выбор темы сегментами', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Профиль' }).click();
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
    await expect(page.getByText('Внешние подключения')).toBeVisible();

    await page.getByRole('button', { name: 'Тёмная', exact: true }).click();
    await expect(await currentTheme(page)).toBe('dark');

    await page.getByRole('button', { name: 'Светлая', exact: true }).click();
    await expect(await currentTheme(page)).toBe('light');
  });

  test('настройки пространства доступны владельцу', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Настройки' }).click();
    await expect(
      page.getByRole('heading', { name: 'Настройки пространства' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Источники' })).toBeVisible();
  });

  test('календарь: фильтры и поиск', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Календарь' }).click();
    await expect(
      page.getByRole('heading', { name: 'Сводный календарь' }),
    ).toBeVisible();

    await page.getByPlaceholder('Поиск по названию').fill('__нет_такого__');
    await expect(page.getByText('Найдено: 0')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сбросить' })).toBeVisible();

    await page.getByRole('button', { name: 'Сбросить' }).click();
    await expect(
      page.getByRole('button', { name: 'Сбросить' }),
    ).toBeHidden();
    await expect(page.getByPlaceholder('Поиск по названию')).toHaveValue('');
  });

  test('создание и удаление пространства', async ({ page }) => {
    await login(page);
    const name = `E2E ${Date.now()}`;

    await page.getByRole('button', { name: 'Создать' }).first().click();
    await page.getByLabel('Название').fill(name);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Создать' })
      .click();

    const card = page
      .getByRole('heading', { name })
      .locator('xpath=ancestor::div[contains(@class,"group")]');
    await expect(card).toBeVisible();

    await card.getByRole('button', { name: 'Удалить' }).click();
    await expect(page.getByRole('heading', { name })).toBeHidden();
  });
});
