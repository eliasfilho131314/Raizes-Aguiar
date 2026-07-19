import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('sanidade e venda de animal com lancamento financeiro automatico', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('health');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Sanidade');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Sanidade Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Sanidade Teste')).toBeVisible({ timeout: 10_000 });

  // Cadastra um animal
  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('55');
  await page.getByLabel('Brinco').fill('S055');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Brinco S055', { exact: false })).toBeVisible({ timeout: 10_000 });

  // Registra sanidade direto na pagina do modulo
  await page.getByRole('link', { name: 'Sanidade' }).click();
  await expect(page.getByRole('heading', { name: 'Sanidade' })).toBeVisible();
  await page.getByLabel('Produto/procedimento').fill('Vacina aftosa');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('Vacina aftosa', { exact: false })).toBeVisible({ timeout: 10_000 });

  // Venda do animal -- confere que lanca receita automatica no financeiro
  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByRole('button', { name: 'Marcar vendido' }).click();
  await page.getByLabel('Valor (R$)').fill('3200');
  await page.getByLabel(/Comprador/).fill('Frigorífico Central');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Vendido em', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Frigorífico Central', { exact: false })).toBeVisible();

  await page.getByRole('link', { name: 'Financeiro' }).click();
  await expect(page.getByText(/Venda.*S055|001|55/, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('3.200,00', { exact: false }).first()).toBeVisible();
});
