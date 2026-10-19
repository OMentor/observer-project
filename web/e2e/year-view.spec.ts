import { test, expect, type Page } from '@playwright/test';

const DEMO_EMAIL = 'demo@pletenie.local';
const DEMO_PASSWORD = 'demo12345';

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

async function openYear(page: Page) {
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
  await page.getByRole('button', { name: 'Год', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Переход к году' }),
  ).toBeVisible();
}

test.describe('Плетение · Год', () => {
  test('вид «Год» показывает двенадцать месяцев и открывает панель дня', async ({
    page,
  }) => {
    await openYear(page);

    const year = new Date().getFullYear();
    for (const month of MONTHS) {
      await expect(
        page.getByRole('button', { name: `${month} ${year}`, exact: true }),
      ).toBeVisible();
    }

    await expect(page.getByRole('button', { name: 'Сегодня' })).toBeVisible();

    await page
      .getByRole('button', { name: /^\d{1,2} [А-Яа-я]+ \d{4}$/ })
      .first()
      .click();
    await expect(page.getByLabel('Детали дня')).toBeVisible();
    await expect(
      page.getByText('Выберите день, чтобы увидеть события.'),
    ).toBeHidden();
  });

  test('навигация по годам, выбор через список и переход к месяцу', async ({
    page,
  }) => {
    await openYear(page);

    const combo = page.getByRole('combobox', { name: 'Переход к году' });
    const before = await combo.inputValue();

    const nextYear = page.getByRole('button', { name: 'Следующий год' }).last();
    const prevYear = page
      .getByRole('button', { name: 'Предыдущий год' })
      .last();

    await nextYear.click();
    await expect(combo).not.toHaveValue(before);
    await prevYear.click();
    await expect(combo).toHaveValue(before);

    await page.getByRole('button', { name: 'Сегодня' }).click();
    await expect(combo).toHaveValue(before);

    const year = new Date().getFullYear();
    await page
      .getByRole('button', { name: `Март ${year}`, exact: true })
      .click();
    await expect(page.getByRole('button', { name: 'Месяц' })).toBeVisible();

    await page.getByRole('button', { name: 'Год', exact: true }).click();
    await expect(
      page.getByRole('combobox', { name: 'Переход к году' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Обычный вид' }).click();
    await expect(page.getByRole('button', { name: 'Квартал' })).toBeVisible();
  });
});
