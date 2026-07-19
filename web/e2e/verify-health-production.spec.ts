import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: sanidade e venda de animal com lancamento financeiro', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodhealth');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Sanidade');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Sanidade');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Sanidade')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('77');
  await page.getByLabel('Brinco').fill('PR077');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Brinco PR077', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Sanidade' }).click();
  await expect(page.getByRole('heading', { name: 'Sanidade' })).toBeVisible();
  await page.getByLabel('Produto/procedimento').fill('Vermifugo Ivermectina');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('Vermifugo Ivermectina', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByRole('button', { name: 'Marcar abatido' }).click();
  await page.getByLabel('Valor (R$)').fill('4500');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Abatido em', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Financeiro' }).click();
  await expect(page.getByText('4.500,00', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
});
