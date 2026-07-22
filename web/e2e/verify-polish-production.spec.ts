import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: categoria acopla sexo automaticamente ao cadastrar animal', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodpolish');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Polish');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Polish');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Polish')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  // Cadastra um touro (categoria macho) e depois uma bezerra (categoria femea)
  // sem tocar no campo Sexo -- antes do fix a bezerra saia com sexo=macho
  // (herdado do envio anterior).
  await page.getByLabel('Número').fill('900');
  await page.getByLabel('Categoria').selectOption('touro');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Ver pesagens').first()).toBeVisible({ timeout: 10_000 });

  await page.getByLabel('Número').fill('901');
  await page.getByLabel('Categoria').selectOption('bezerra');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Bezerra · Fêmea', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Reprodução' }).click();
  await expect(page.getByRole('heading', { name: 'Reprodução' })).toBeVisible();
  await expect(page.getByText('Cadastre uma fêmea ativa', { exact: false })).not.toBeVisible();

  // Financeiro: cards de resumo nao devem cortar em tela estreita
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('link', { name: 'Financeiro' }).click();
  const despesasCard = page.getByText('Despesas (total)').locator('..');
  const box = await despesasCard.boundingBox();
  expect(box).toBeTruthy();
  if (box) expect(box.x + box.width).toBeLessThanOrEqual(375);
});
