import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

test('producao: favicon e logo aplicados', async ({ page }) => {
  test.setTimeout(60_000);

  const faviconRes = await page.request.get('/favicon.png');
  expect(faviconRes.status()).toBe(200);
  expect(faviconRes.headers()['content-type']).toContain('image/png');

  await page.goto('/login', { waitUntil: 'networkidle' });
  const logoImg = page.locator('img[src="/logo-full.png"]');
  await expect(logoImg).toBeVisible({ timeout: 10_000 });
  const naturalWidth = await logoImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);
});
