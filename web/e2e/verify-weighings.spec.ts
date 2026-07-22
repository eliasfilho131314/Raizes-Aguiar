import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('pesagens: relatorio dedicado com GMD calculado', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('weighing');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Pesagens');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Pesagens Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Pesagens Teste')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('800');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Ver pesagens')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Ver pesagens' }).click();
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  await page.getByLabel('Data', { exact: true }).fill(tenDaysAgo.toISOString().slice(0, 10));
  await page.getByLabel('Peso (kg)').fill('200');
  await page.getByRole('button', { name: 'Registrar pesagem' }).click();
  await expect(page.getByText('200kg', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByLabel('Data', { exact: true }).fill(new Date().toISOString().slice(0, 10));
  await page.getByLabel('Peso (kg)').fill('220');
  await page.getByRole('button', { name: 'Registrar pesagem' }).click();
  await expect(page.getByText('220kg', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pesagens' }).click();
  await expect(page.getByRole('heading', { name: 'Pesagens' })).toBeVisible();
  await expect(page.getByText('Animais pesados')).toBeVisible();
  await expect(page.getByText('220kg em', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('GMD 2.00kg/dia', { exact: false })).toBeVisible();
});
