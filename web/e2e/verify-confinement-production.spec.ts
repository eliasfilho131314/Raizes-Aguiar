import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: confinamento (cadastro de lote + finalizar)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodconfinement');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Confinamento');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Confinamento');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Confinamento')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Confinamento' }).click();
  await expect(page.getByRole('heading', { name: 'Confinamento', exact: true })).toBeVisible();
  await page.getByLabel('Nome do lote').fill('Curral 1 — recria');
  await page.getByLabel('Quantidade de animais').fill('18');
  await page.getByRole('button', { name: 'Cadastrar lote' }).click();
  await expect(page.getByText('Curral 1 — recria', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('18 animais', { exact: false })).toBeVisible();
});
