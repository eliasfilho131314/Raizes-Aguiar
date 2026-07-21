import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: pastagens (cadastro + rotacao de lote)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodpasture');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Pastagens');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Pastagens');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Pastagens')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pastagens' }).click();
  await expect(page.getByRole('heading', { name: 'Pastagens' })).toBeVisible();
  await page.getByLabel('Nome').fill('Piquete Norte');
  await page.getByRole('button', { name: 'Cadastrar piquete' }).click();
  await expect(page.getByText('Piquete Norte', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Rotacionar lote' }).click();
  await page.getByLabel('Lote atual').fill('Lote de recria');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Lote de recria', { exact: false })).toBeVisible({ timeout: 10_000 });
});
