import { test, expect, request as pwRequest, type Page } from '@playwright/test';

const API = 'http://localhost:3000';
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

test.describe('Плетение · realtime', () => {
  test('индикатор подключения показывает «Онлайн»', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Календарь' }).click();
    await expect(
      page.getByRole('heading', { name: 'Сводный календарь' }),
    ).toBeVisible();
    await expect(page.getByText('Онлайн', { exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('новое событие другого клиента появляется без перезагрузки', async ({
    page,
  }) => {
    await login(page);
    await page.getByRole('link', { name: 'Календарь' }).click();
    await expect(page.getByText('Онлайн', { exact: true })).toBeVisible({
      timeout: 10000,
    });

    const api = await pwRequest.newContext();
    const auth = await (
      await api.post(`${API}/auth/login`, {
        data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      })
    ).json();
    const headers = { Authorization: `Bearer ${auth.accessToken}` };

    const spaces = await (await api.get(`${API}/spaces`, { headers })).json();
    const source = spaces.flatMap((s: { sources: unknown[] }) => s.sources)[0] as {
      id: string;
    };

    const title = `RT ${Date.now()}`;
    const created = await (
      await api.post(`${API}/sources/${source.id}/events`, {
        headers,
        data: {
          title,
          start_at: new Date().toISOString(),
          end_at: new Date(Date.now() + 3_600_000).toISOString(),
        },
      })
    ).json();

    await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });

    await api.delete(`${API}/events/${created.id}`, { headers });
    await api.dispose();
  });
});
