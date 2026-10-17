import { test, expect } from '@playwright/test';

test.describe('Плетение · PWA', () => {
  test('манифест и иконки подключены и доступны', async ({ page, request }) => {
    await page.goto('/login');

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest',
    );
    await expect(
      page.locator('link[rel="apple-touch-icon"]'),
    ).toHaveAttribute('href', '/icons/apple-touch-icon.png');
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
      'content',
      '#1a1a1e',
    );

    const manifestResponse = await request.get('/manifest.webmanifest');
    expect(manifestResponse.status()).toBe(200);
    const manifest = await manifestResponse.json();
    expect(manifest.name).toContain('Плетение');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toBe('#1a1a1e');

    const icons = manifest.icons as Array<{
      src: string;
      sizes: string;
      purpose?: string;
    }>;
    expect(icons.length).toBeGreaterThanOrEqual(3);
    expect(icons.some((icon) => icon.sizes === '192x192')).toBe(true);
    expect(icons.some((icon) => icon.sizes === '512x512')).toBe(true);
    expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);

    for (const icon of icons) {
      const iconResponse = await request.get(icon.src);
      expect(iconResponse.status(), icon.src).toBe(200);
      expect(iconResponse.headers()['content-type']).toContain('image/png');
    }
  });
});
