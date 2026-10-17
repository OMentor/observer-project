import { test, expect } from '@playwright/test';

test.describe('Плетение · логотип', () => {
  test('логотип показан на входе, а фавикон обслуживается брендом', async ({
    page,
    request,
  }) => {
    await page.goto('/login');
    await expect(page.getByRole('img', { name: 'Плетение' })).toBeVisible();

    const favicon = await request.get('/favicon.svg');
    expect(favicon.status()).toBe(200);
    expect(favicon.headers()['content-type']).toContain('svg');
    const body = await favicon.text();
    expect(body).toContain('linearGradient');
    expect(body).toContain('M12 6');
  });

  test('вплетение нитей отключается при prefers-reduced-motion', async ({
    page,
  }) => {
    await page.goto('/login');
    const strand = page.locator('svg.animate-weave .logo-strand').first();
    await expect(strand).toHaveCount(1);

    const normal = await strand.evaluate(
      (el) => getComputedStyle(el).animationDuration,
    );
    expect(normal).toBe('0.72s');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    const reduced = await strand.evaluate(
      (el) => getComputedStyle(el).animationDuration,
    );
    expect(parseFloat(reduced)).toBeLessThan(0.001);
  });
});
