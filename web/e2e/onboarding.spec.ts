import { test, expect, type Page } from '@playwright/test';

function uniqueEmail(): string {
  return `onb_${Date.now()}_${Math.floor(Math.random() * 1000)}@pletenie.local`;
}

async function registerWithSpace(page: Page, email: string) {
  await page.goto('/register');
  await page.getByLabel('Имя').fill('Новый Пользователь');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill('secret12345');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(page.getByText('Пока нет пространств')).toBeVisible();
  await page.getByRole('button', { name: 'Создать пространство' }).click();
  await page.getByLabel('Название').fill('Тестовое');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Создать' })
    .click();

  await expect(page.getByTestId('onboarding')).toBeVisible();
}

test.describe('Плетение · онбординг', () => {
  test('ведёт от пустого состояния к пространству и токену', async ({
    page,
  }) => {
    await registerWithSpace(page, uniqueEmail());

    await expect(page.getByTestId('onboarding-step-space')).toHaveAttribute(
      'data-done',
      'true',
    );
    await expect(page.getByTestId('onboarding-step-token')).toHaveAttribute(
      'data-active',
      'true',
    );

    await page.getByRole('link', { name: /Создать токен/ }).click();
    await expect(page).toHaveURL(/\/tokens/);
  });

  test('скрывается по кнопке и остаётся скрытым после перезагрузки', async ({
    page,
  }) => {
    await registerWithSpace(page, uniqueEmail());

    await page.getByRole('button', { name: 'Скрыть подсказки' }).click();
    await expect(page.getByTestId('onboarding')).toBeHidden();

    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Пространства' }),
    ).toBeVisible();
    await expect(page.getByTestId('onboarding')).toBeHidden();
  });
});
