import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: relatorios (rebanho por categoria + grafico financeiro)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodreports');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Relatorios');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Relatorios');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Relatorios')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('601');
  await page.getByLabel('Categoria').selectOption('touro');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Ver pesagens')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Relatórios' }).click();
  await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();
  await expect(page.getByText('Touro', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Receitas x despesas', { exact: false })).toBeVisible();
});
