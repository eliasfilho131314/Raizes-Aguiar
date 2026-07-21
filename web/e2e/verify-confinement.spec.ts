import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('confinamento: cadastro de lote e finalizar', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('confinement');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Confinamento');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Confinamento Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Confinamento Teste')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Confinamento' }).click();
  await expect(page.getByRole('heading', { name: 'Confinamento', exact: true })).toBeVisible();

  await page.getByLabel('Nome do lote').fill('Curral 2 — engorda');
  await page.getByLabel('Quantidade de animais').fill('25');
  await page.getByLabel('Peso médio de entrada (kg, opcional)').fill('320');
  await page.getByLabel('Consumo de ração (kg/dia, opcional)').fill('50');
  await page.getByRole('button', { name: 'Cadastrar lote' }).click();
  await expect(page.getByText('Curral 2 — engorda', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('25 animais', { exact: false })).toBeVisible();
  await expect(page.getByText('entrada 320kg', { exact: false })).toBeVisible();

  await page.getByText('Ativo', { exact: true }).click();
  await expect(page.getByText('Finalizado', { exact: true })).toBeVisible({ timeout: 10_000 });
});
