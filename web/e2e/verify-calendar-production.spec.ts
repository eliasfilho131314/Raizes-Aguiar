import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: calendario (tarefa manual + agenda unificada)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodcalendar');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Calendario');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Calendario');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Calendario')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Calendário' }).click();
  await expect(page.getByRole('heading', { name: 'Calendário' })).toBeVisible();
  await page.getByLabel('Título').fill('Revisar cerca do pasto 3');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await expect(page.getByText('Revisar cerca do pasto 3', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Marcar como concluído' }).click();
  await expect(page.getByRole('button', { name: 'Marcar como pendente' })).toBeVisible({ timeout: 10_000 });
});
