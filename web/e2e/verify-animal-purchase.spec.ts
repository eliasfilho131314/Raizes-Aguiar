import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('compra de animal lanca despesa automatica no financeiro', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('purchase');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Compra');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Compra Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Compra Teste')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('900');
  await page.getByLabel('Brinco').fill('C900');
  await page.getByLabel('Origem (opcional)').fill('Compra em leilão');
  await page.getByLabel('Valor de compra (R$, opcional)').fill('2800');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Brinco C900', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Compra em leilão', { exact: false })).toBeVisible();
  await expect(page.getByText('2.800,00', { exact: false })).toBeVisible();

  await page.getByRole('link', { name: 'Financeiro' }).click();
  await expect(page.getByText('Compra — 900', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('2.800,00', { exact: false }).first()).toBeVisible();
});
