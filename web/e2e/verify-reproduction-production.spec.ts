import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: reproducao (cio, inseminacao, diagnostico, parto)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodrepro');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Reproducao');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Reproducao');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Reproducao')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('301');
  await page.getByLabel('Brinco').fill('R301');
  await page.getByLabel('Sexo').selectOption('femea');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Brinco R301', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Reprodução' }).click();
  await expect(page.getByRole('heading', { name: 'Reprodução' })).toBeVisible();

  await page.getByLabel('Tipo').selectOption('diagnostico');
  await expect(page.getByLabel('Previsão de parto')).not.toHaveValue('');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('previsão:', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Partos previstos')).toBeVisible();
});
