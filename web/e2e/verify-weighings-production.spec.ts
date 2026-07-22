import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: pesagens (relatorio dedicado)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodweighing');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Pesagens');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Pesagens');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Pesagens')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('801');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Ver pesagens')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Ver pesagens' }).click();
  await page.getByLabel('Peso (kg)').fill('250');
  await page.getByRole('button', { name: 'Registrar pesagem' }).click();
  await expect(page.getByText('250kg', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pesagens' }).click();
  await expect(page.getByRole('heading', { name: 'Pesagens' })).toBeVisible();
  await expect(page.getByText('250kg em', { exact: false })).toBeVisible({ timeout: 10_000 });
});
