import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('mortalidade: registrar morte aparece no relatorio dedicado', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('mortality');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Mortalidade');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Mortalidade Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Mortalidade Teste')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('400');
  await page.getByLabel('Brinco').fill('M400');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Brinco M400', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Registrar morte' }).click();
  await page.getByLabel(/Motivo/).fill('Suspeita de pneumonia');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Morto em', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Mortalidade' }).click();
  await expect(page.getByRole('heading', { name: 'Mortalidade' })).toBeVisible();
  await expect(page.getByText('Total de mortes')).toBeVisible();
  await expect(page.getByText('Suspeita de pneumonia', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('100.0%', { exact: false })).toBeVisible();
});
