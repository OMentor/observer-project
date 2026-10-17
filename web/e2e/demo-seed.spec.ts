import { test, expect, type Page } from '@playwright/test';

function uniqueEmail(): string {
  return `demo_${Date.now()}_${Math.floor(Math.random() * 1000)}@pletenie.local`;
}

function currentQuarterFirstMonth(): Date {
  const now = new Date();
  const month = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), month, 10, 12, 0, 0);
}

async function registerFresh(page: Page, email: string) {
  await page.goto('/register');
  await page.getByLabel('Имя').fill('Демо Тестер');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill('secret12345');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await expect(page.getByText('Пока нет пространств')).toBeVisible();
}

test.describe('Плетение · демо-данные', () => {
  test('кнопка «Заполнить примером» создаёт пространства, источники и события', async ({
    page,
  }) => {
    await page.clock.setFixedTime(currentQuarterFirstMonth());
    await registerFresh(page, uniqueEmail());

    const seedButton = page.getByRole('button', { name: 'Заполнить примером' });
    await expect(seedButton).toBeVisible();
    await seedButton.click();

    await expect(page.getByText('Пример данных готов')).toBeVisible();
    await expect(page.getByTestId('space-card')).toHaveCount(2);
    await expect(
      page.getByText('Работа', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Личное', { exact: true }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Календарь' }).click();
    await expect(
      page.getByRole('heading', { name: 'Сводный календарь' }),
    ).toBeVisible();
    await expect(page.getByText('Планёрка команды')).toBeVisible();
  });
});
