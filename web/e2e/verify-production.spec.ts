import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: cadastro, criar fazenda, cadastrar animal, financeiro', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prod');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Teste');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });

  await page.getByLabel('Nome').fill('Fazenda Producao');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Producao')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('1');
  await page.getByLabel('Brinco').fill('P001');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Brinco P001', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Financeiro' }).click();
  await page.getByLabel('Valor (R$)').fill('999');
  await page.getByLabel('Descrição (opcional)').fill('Teste de producao');
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByText('Teste de producao')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText('Total de animais')).toBeVisible({ timeout: 10_000 });
});
