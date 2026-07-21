import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('planilhas: exportar animais em csv e importar de volta', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('sheets');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Planilhas');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Planilhas Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Planilhas Teste')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('700');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Ver pesagens')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Planilhas' }).click();
  await expect(page.getByRole('heading', { name: 'Planilhas', exact: true })).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar animais' }).click()]);
  const path = await download.path();
  expect(path).toBeTruthy();

  const csv =
    'numero,brinco,nome,sexo,categoria,raca,lote,dataNascimento,pesoNascimentoKg,origem,valorCompra,status,observacoes\n' +
    '701,B701,,femea,bezerra,,,,,,,,';
  await page.setInputFiles('input[type="file"]', {
    name: 'importar.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf-8'),
  });
  await expect(page.getByText('1 animal(is) importado(s)', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await expect(page.getByText('Brinco B701', { exact: false })).toBeVisible({ timeout: 10_000 });
});
