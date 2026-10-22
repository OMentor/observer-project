import {
  test,
  expect,
  request as pwRequest,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

const API = 'http://localhost:3000';
const RADICALE = 'http://localhost:5232';
const EMAIL = 'demo@pletenie.local';
const PASSWORD = 'demo12345';
const BASIC = `Basic ${Buffer.from('dev:dev').toString('base64')}`;

interface Seeded {
  headers: Record<string, string>;
  connectionId: string;
  spaceId: string;
  sourceId: string;
  eventId: string;
  externalId: string;
  calendarUrl: string;
  localTitle: string;
  localEdited: string;
  externalTitle: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Пароль').fill(PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(
    page.getByRole('heading', { name: 'Пространства' }),
  ).toBeVisible();
}

async function waitForSynced(
  api: APIRequestContext,
  headers: Record<string, string>,
  eventId: string,
): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await api.get(`${API}/events/${eventId}`, { headers });
    if (response.ok()) {
      const event = await response.json();
      if (event.sync_status === 'synced' && event.external_id) {
        return event.external_id as string;
      }
    }
    await sleep(500);
  }
  throw new Error(`Событие ${eventId} не синхронизировалось с Radicale`);
}

async function seedEvent(api: APIRequestContext): Promise<Seeded> {
  const stamp = Date.now();
  const calendarUrl = `${RADICALE}/dev/e2e-${stamp}/`;

  await api.fetch(calendarUrl, {
    method: 'DELETE',
    headers: { Authorization: BASIC },
  });
  const made = await api.fetch(calendarUrl, {
    method: 'MKCALENDAR',
    headers: { Authorization: BASIC },
  });
  expect(made.status()).toBeLessThan(400);

  const auth = await (
    await api.post(`${API}/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    })
  ).json();
  const headers = { Authorization: `Bearer ${auth.accessToken}` };

  const connection = await (
    await api.post(`${API}/sync/connections`, {
      headers,
      data: {
        provider: 'yandex',
        url: RADICALE,
        username: 'dev',
        password: 'dev',
      },
    })
  ).json();
  const space = await (
    await api.post(`${API}/spaces`, {
      headers,
      data: { name: `E2E Sync ${stamp}` },
    })
  ).json();
  const source = await (
    await api.post(`${API}/spaces/${space.id}/sources`, {
      headers,
      data: { name: 'E2E источник', color: '#5B5FEF' },
    })
  ).json();
  const link = await api.post(`${API}/sources/${source.id}/link`, {
    headers,
    data: {
      connectionId: connection.id,
      externalCalendarId: calendarUrl,
      syncDirection: 'both',
    },
  });
  expect(link.ok()).toBeTruthy();

  const localTitle = `Локальная ${stamp}`;
  const event = await (
    await api.post(`${API}/sources/${source.id}/events`, {
      headers,
      data: {
        title: localTitle,
        start_at: '2026-12-05T10:00:00.000Z',
        end_at: '2026-12-05T11:00:00.000Z',
        location: 'Офис',
      },
    })
  ).json();

  const externalId = await waitForSynced(api, headers, event.id);

  return {
    headers,
    connectionId: connection.id,
    spaceId: space.id,
    sourceId: source.id,
    eventId: event.id,
    externalId,
    calendarUrl,
    localTitle,
    localEdited: `${localTitle} правка`,
    externalTitle: `Внешняя ${stamp}`,
  };
}

/** Внешняя правка через CalDAV + локальная правка → конфликт в очереди. */
async function triggerConflict(
  api: APIRequestContext,
  seeded: Seeded,
): Promise<string> {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pletenie E2E//RU',
    'BEGIN:VEVENT',
    `UID:${seeded.externalId}`,
    'DTSTAMP:20261205T090000Z',
    'DTSTART:20261205T140000Z',
    'DTEND:20261205T150000Z',
    `SUMMARY:${seeded.externalTitle}`,
    'LOCATION:Онлайн',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const put = await api.put(`${seeded.calendarUrl}${seeded.externalId}.ics`, {
    headers: {
      Authorization: BASIC,
      'Content-Type': 'text/calendar; charset=utf-8',
    },
    data: ics,
  });
  expect(put.ok()).toBeTruthy();

  const patched = await api.patch(`${API}/events/${seeded.eventId}`, {
    headers: seeded.headers,
    data: { title: seeded.localEdited },
  });
  expect(patched.ok()).toBeTruthy();

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const list = await (
      await api.get(`${API}/sync/conflicts`, { headers: seeded.headers })
    ).json();
    const found = list.items.find(
      (item: { event_id: string }) => item.event_id === seeded.eventId,
    );
    if (found) {
      return found.id as string;
    }
    await sleep(500);
  }
  throw new Error('Конфликт не появился в очереди');
}

async function cleanup(api: APIRequestContext, seeded: Seeded) {
  try {
    const list = await (
      await api.get(`${API}/sync/conflicts`, { headers: seeded.headers })
    ).json();
    for (const item of list.items) {
      if (item.event_id === seeded.eventId) {
        await api.post(`${API}/sync/conflicts/${item.id}/resolve`, {
          headers: seeded.headers,
          data: { resolution: 'local' },
        });
      }
    }
  } catch {
    // Конфликт мог быть уже разрешён тестом.
  }
  try {
    await api.delete(`${API}/sources/${seeded.sourceId}/link`, {
      headers: seeded.headers,
    });
  } catch {
    // Связь могла быть удалена.
  }
  try {
    await api.delete(`${API}/spaces/${seeded.spaceId}`, {
      headers: seeded.headers,
    });
  } catch {
    // Пространство могло быть удалено.
  }
  try {
    await api.delete(`${API}/sync/connections/${seeded.connectionId}`, {
      headers: seeded.headers,
    });
  } catch {
    // Подключение могло быть удалено.
  }
  try {
    await api.fetch(seeded.calendarUrl, {
      method: 'DELETE',
      headers: { Authorization: BASIC },
    });
  } catch {
    // Календарь мог быть удалён.
  }
}

test.describe('Плетение · конфликты синхронизации', () => {
  test('разрешение в пользу внешней версии применяет изменения', async ({
    page,
  }) => {
    const api = await pwRequest.newContext();
    const seeded = await seedEvent(api);
    try {
      await triggerConflict(api, seeded);

      await login(page);
      await page.goto('/sync/conflicts');
      await expect(
        page.getByRole('heading', { name: 'Конфликты синхронизации' }),
      ).toBeVisible();

      const card = page
        .getByTestId('conflict-card')
        .filter({ hasText: seeded.localEdited });
      await expect(card).toBeVisible();
      await card.getByRole('button', { name: 'Разрешить' }).click();

      const dialog = page.getByRole('dialog');
      await expect(
        dialog.getByRole('heading', {
          name: `Конфликт: «${seeded.localEdited}»`,
        }),
      ).toBeVisible();
      await dialog.getByRole('button', { name: 'Внешняя версия' }).click();

      await expect(card).toHaveCount(0, { timeout: 10000 });

      const event = await (
        await api.get(`${API}/events/${seeded.eventId}`, {
          headers: seeded.headers,
        })
      ).json();
      expect(event.title).toBe(seeded.externalTitle);
      expect(event.sync_status).toBe('synced');
    } finally {
      await cleanup(api, seeded);
      await api.dispose();
    }
  });

  test('объединение: внешнее название и наше время/место', async ({ page }) => {
    const api = await pwRequest.newContext();
    const seeded = await seedEvent(api);
    try {
      await triggerConflict(api, seeded);

      await login(page);
      await page.goto('/sync/conflicts');

      const card = page
        .getByTestId('conflict-card')
        .filter({ hasText: seeded.localEdited });
      await expect(card).toBeVisible();
      await card.getByRole('button', { name: 'Разрешить' }).click();

      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: 'Объединить' }).click();
      await expect(
        dialog.getByRole('heading', { name: 'Объединить правки' }),
      ).toBeVisible();
      await dialog.getByRole('radio', { name: 'Название: внешняя' }).check();
      await dialog.getByRole('button', { name: 'Сохранить' }).click();

      await expect(card).toHaveCount(0, { timeout: 10000 });

      const event = await (
        await api.get(`${API}/events/${seeded.eventId}`, {
          headers: seeded.headers,
        })
      ).json();
      expect(event.title).toBe(seeded.externalTitle);
      expect(event.location).toBe('Офис');
      expect(new Date(event.start_at).toISOString()).toBe(
        '2026-12-05T10:00:00.000Z',
      );
    } finally {
      await cleanup(api, seeded);
      await api.dispose();
    }
  });

  test('новый конфликт приходит по realtime с уведомлением', async ({
    page,
  }) => {
    const api = await pwRequest.newContext();
    const seeded = await seedEvent(api);
    try {
      await login(page);
      await page.getByRole('link', { name: 'Календарь' }).click();
      await expect(page.getByText('Онлайн', { exact: true })).toBeVisible({
        timeout: 10000,
      });

      await triggerConflict(api, seeded);

      await expect(
        page.getByText('Конфликт синхронизации', { exact: true }),
      ).toBeVisible({ timeout: 15000 });
    } finally {
      await cleanup(api, seeded);
      await api.dispose();
    }
  });
});
