import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: estoque (entrada com despesa e saida)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodstock');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Estoque');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Estoque');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Estoque')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Estoque' }).click();
  await expect(page.getByRole('heading', { name: 'Estoque' })).toBeVisible();

  await page.getByLabel('Nome').fill('Sal mineral');
  await page.getByLabel('Categoria').selectOption('racao');
  await page.getByLabel('Unidade').fill('kg');
  await page.getByRole('button', { name: 'Cadastrar item' }).click();
  await expect(page.getByText('Sal mineral', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Ver movimentações' }).click();
  await page.getByLabel('Quantidade (kg)').fill('100');
  await page.getByLabel('Valor total (R$, opcional)').fill('450');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('100 kg', { exact: false }).first()).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Financeiro' }).click();
  await expect(page.getByText('Compra de estoque — Sal mineral', { exact: false })).toBeVisible({ timeout: 10_000 });
});
