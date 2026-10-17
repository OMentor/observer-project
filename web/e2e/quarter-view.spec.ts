import { test, expect, type Page } from '@playwright/test';

const DEMO_EMAIL = 'demo@pletenie.local';
const DEMO_PASSWORD = 'demo12345';

async function openCalendar(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(DEMO_EMAIL);
  await page.getByLabel('Пароль').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(
    page.getByRole('heading', { name: 'Пространства' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Календарь' }).click();
  await expect(
    page.getByRole('heading', { name: 'Сводный календарь' }),
  ).toBeVisible();
}

test.describe('Плетение · Квартал', () => {
  test('вид «Квартал» показывает месяцы и открывает панель дня', async ({
    page,
  }) => {
    await openCalendar(page);
    await page.getByRole('button', { name: 'Квартал' }).click();

    await expect(page.getByRole('button', { name: 'Сегодня' })).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'Переход к кварталу' }),
    ).toBeVisible();
    await expect(
      page.getByText('Выберите день, чтобы увидеть события.'),
    ).toBeVisible();

    await page
      .getByRole('button', { name: /^\d{1,2} [А-Яа-я]+ \d{4}$/ })
      .first()
      .click();
    await expect(
      page.getByText('Выберите день, чтобы увидеть события.'),
    ).toBeHidden();
    await expect(page.getByLabel('Детали дня')).toBeVisible();

    await page.getByRole('button', { name: 'Обычный вид' }).click();
    await expect(page.getByRole('button', { name: 'Месяц' })).toBeVisible();
  });

  test('навигация по кварталам и фильтры работают', async ({ page }) => {
    await openCalendar(page);
    await page.getByRole('button', { name: 'Квартал' }).click();

    const combo = page.getByRole('combobox', { name: 'Переход к кварталу' });
    const before = await combo.inputValue();
    await page.getByRole('button', { name: 'Следующий квартал' }).click();
    await expect(combo).not.toHaveValue(before);
    await page.getByRole('button', { name: 'Предыдущий квартал' }).click();
    await expect(combo).toHaveValue(before);

    const busy = page.getByRole('button', { name: 'Только занятость' });
    await expect(busy).toHaveAttribute('aria-pressed', 'false');
    await busy.click();
    await expect(busy).toHaveAttribute('aria-pressed', 'true');

    const weekends = page.getByRole('button', { name: 'Скрыть выходные' });
    await weekends.click();
    await expect(page.getByText('Сб', { exact: true })).toHaveCount(0);
  });
});
