import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: mortalidade (registrar morte + relatorio)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodmortality');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Mortalidade');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Mortalidade');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Mortalidade')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('401');
  await page.getByLabel('Brinco').fill('M401');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Brinco M401', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Registrar morte' }).click();
  await page.getByLabel(/Motivo/).fill('Raio');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Morto em', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Mortalidade' }).click();
  await expect(page.getByRole('heading', { name: 'Mortalidade' })).toBeVisible();
  await expect(page.getByText('Raio', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('100.0%', { exact: false })).toBeVisible();
});
