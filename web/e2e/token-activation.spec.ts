import { test, expect, type Page } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}@pletenie.local`;
}

async function registerWithSpace(page: Page): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Имя').fill('Владелец Тест');
  await page.getByLabel('Email').fill(uniqueEmail('owner'));
  await page.getByLabel('Пароль').fill('secret12345');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(page.getByText('Пока нет пространств')).toBeVisible();
  await page.getByRole('button', { name: 'Создать пространство' }).click();
  await page.getByLabel('Название').fill('Команда');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Создать' })
    .click();
  await expect(page.getByTestId('onboarding')).toBeVisible();
}

async function issueToken(page: Page): Promise<string> {
  await page.goto('/tokens');
  await page.getByRole('button', { name: 'Токен', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Создать' })
    .click();

  const code = page.locator('code').first();
  await expect(code).toBeVisible();
  return (await code.innerText()).trim();
}

function activateUrl(origin: string, token: string): string {
  return `${origin}/activate/${token}`;
}

test.describe('Плетение · активация токена по ссылке', () => {
  test('новый участник: ссылка → регистрация → активация', async ({
    page,
    browser,
  }) => {
    await registerWithSpace(page);
    const origin = new URL(page.url()).origin;
    const token = await issueToken(page);
    const url = activateUrl(origin, token);

    const context = await browser.newContext({ baseURL: origin });
    const invitee = await context.newPage();

    await invitee.goto(url);
    await expect(
      invitee.getByRole('button', { name: 'Войти' }),
    ).toBeVisible();

    await invitee.getByRole('link', { name: 'Зарегистрироваться' }).click();
    await expect(
      invitee.getByRole('button', { name: 'Создать аккаунт' }),
    ).toBeVisible();
    await invitee.getByLabel('Имя').fill('Приглашённый');
    await invitee.getByLabel('Email').fill(uniqueEmail('invitee'));
    await invitee.getByLabel('Пароль').fill('secret12345');
    await invitee.getByRole('button', { name: 'Создать аккаунт' }).click();

    await expect(
      invitee.getByRole('heading', { name: 'Приглашение' }),
    ).toBeVisible();
    await invitee.getByRole('button', { name: 'Активировать' }).click();
    await expect(
      invitee.getByText('Вы присоединились к пространству.'),
    ).toBeVisible();

    await invitee.getByRole('link', { name: 'К пространству' }).click();
    await expect(invitee).toHaveURL(/\/spaces\//);

    await context.close();
  });

  test('вошедший пользователь активирует токен по ссылке', async ({
    page,
    browser,
  }) => {
    await registerWithSpace(page);
    const origin = new URL(page.url()).origin;
    const token = await issueToken(page);
    const url = activateUrl(origin, token);

    const context = await browser.newContext({ baseURL: origin });
    const invitee = await context.newPage();

    await invitee.goto('/register');
    await invitee.getByLabel('Имя').fill('Уже Есть');
    await invitee.getByLabel('Email').fill(uniqueEmail('member'));
    await invitee.getByLabel('Пароль').fill('secret12345');
    await invitee.getByRole('button', { name: 'Создать аккаунт' }).click();
    await expect(
      invitee.getByRole('heading', { name: 'Пространства' }),
    ).toBeVisible();

    await invitee.goto(url);
    await invitee.getByRole('button', { name: 'Активировать' }).click();
    await expect(
      invitee.getByText('Вы присоединились к пространству.'),
    ).toBeVisible();

    await context.close();
  });
});
