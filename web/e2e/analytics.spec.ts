import { test, expect, type Page } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(
    page.getByRole('heading', { name: 'Пространства' }),
  ).toBeVisible();
}

async function accessToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    const raw = localStorage.getItem('pletenie.auth');
    return raw ? (JSON.parse(raw).state.accessToken as string) : null;
  });
  if (!token) {
    throw new Error('access token not found');
  }
  return token;
}

test.describe('Плетение · аналитика воронки', () => {
  test('администратор видит воронку и получает данные из API', async ({
    page,
    request,
  }) => {
    await login(page, 'admin@pletenie.local', 'admin12345');

    const navLink = page.getByRole('link', { name: 'Аналитика' }).first();
    await expect(navLink).toBeVisible();
    await navLink.click();

    await expect(page).toHaveURL(/\/analytics$/);
    await expect(
      page.getByRole('heading', { name: 'Аналитика' }),
    ).toBeVisible();
    await expect(page.getByTestId('funnel')).toBeVisible();
    await expect(
      page.locator('[data-testid^="funnel-step-"]'),
    ).toHaveCount(5);

    const token = await accessToken(page);
    const response = await request.get(`${API_URL}/analytics/funnel`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.steps).toHaveLength(5);
    expect(body.steps[0].key).toBe('signup');
  });

  test('обычный пользователь не видит раздел и получает 403 от API', async ({
    page,
    request,
  }) => {
    await login(page, 'demo@pletenie.local', 'demo12345');

    await expect(page.getByRole('link', { name: 'Аналитика' })).toHaveCount(0);

    await page.goto('/analytics');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('funnel')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Пространства' }),
    ).toBeVisible();

    const token = await accessToken(page);
    const response = await request.get(`${API_URL}/analytics/funnel`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(403);
  });
});
