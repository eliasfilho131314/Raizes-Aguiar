import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: planilhas (exportar + importar animais em csv)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodsheets');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Planilhas');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Planilhas');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Planilhas')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Planilhas' }).click();
  await expect(page.getByRole('heading', { name: 'Planilhas', exact: true })).toBeVisible();

  const csv =
    'numero,brinco,nome,sexo,categoria,raca,lote,dataNascimento,pesoNascimentoKg,origem,valorCompra,status,observacoes\n' +
    '801,B801,,femea,bezerra,,,,,,,,';
  await page.setInputFiles('input[type="file"]', {
    name: 'importar.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf-8'),
  });
  await expect(page.getByText('1 animal(is) importado(s)', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await expect(page.getByText('Brinco B801', { exact: false })).toBeVisible({ timeout: 10_000 });
});
