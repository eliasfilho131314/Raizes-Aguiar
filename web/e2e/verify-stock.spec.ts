import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('estoque: cadastro de item, entrada com despesa e saida', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('stock');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Estoque');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Estoque Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Estoque Teste')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Estoque' }).click();
  await expect(page.getByRole('heading', { name: 'Estoque' })).toBeVisible();

  await page.getByLabel('Nome').fill('Sal mineral');
  await page.getByLabel('Categoria').selectOption('racao');
  await page.getByLabel('Unidade').fill('kg');
  await page.getByLabel('Estoque mínimo (opcional)').fill('50');
  await page.getByRole('button', { name: 'Cadastrar item' }).click();
  await expect(page.getByText('Sal mineral', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('mínimo: 50 kg', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Ver movimentações' }).click();
  await page.getByLabel('Quantidade (kg)').fill('200');
  await page.getByLabel('Valor total (R$, opcional)').fill('900');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('200 kg', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('900,00', { exact: false }).first()).toBeVisible();

  // Confere que a entrada lancou a despesa no Financeiro
  await page.getByRole('link', { name: 'Financeiro' }).click();
  await expect(page.getByText('Compra de estoque — Sal mineral', { exact: false })).toBeVisible({ timeout: 10_000 });

  // Saida diminui a quantidade -- confere no card principal do item
  await page.getByRole('link', { name: 'Estoque' }).click();
  await page.getByRole('button', { name: 'Ver movimentações' }).click();
  await page.getByLabel('Tipo').selectOption('saida');
  await page.getByLabel('Quantidade (kg)').fill('30');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('170 kg', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
});
