import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('pastagens: cadastro, rotacao de lote e descanso', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('pasture');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Pastagens');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Pastagens Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Pastagens Teste')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pastagens' }).click();
  await expect(page.getByRole('heading', { name: 'Pastagens' })).toBeVisible();

  await page.getByLabel('Nome').fill('Piquete 3');
  await page.getByLabel('Área (hectares, opcional)').fill('12');
  await page.getByLabel('Capacidade de suporte (UA, opcional)').fill('30');
  await page.getByRole('button', { name: 'Cadastrar piquete' }).click();
  await expect(page.getByText('Piquete 3', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('12 ha', { exact: false })).toBeVisible();
  await expect(page.getByText('sem lote', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Rotacionar lote' }).click();
  await page.getByLabel('Lote atual').fill('Lote das novilhas');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Lote das novilhas', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByText('Em uso', { exact: true }).click();
  await expect(page.getByText('Descanso', { exact: true })).toBeVisible({ timeout: 10_000 });
});
