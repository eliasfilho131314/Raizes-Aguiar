import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: funcionarios (cadastro + pagamento lanca despesa)', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodemployee');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Funcionarios');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Funcionarios');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Funcionarios')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Funcionários' }).click();
  await expect(page.getByRole('heading', { name: 'Funcionários' })).toBeVisible();

  await page.getByLabel('Nome').fill('Maria Ordenhadora');
  await page.getByLabel('Salário (R$, opcional)').fill('1900');
  await page.getByRole('button', { name: 'Cadastrar funcionário' }).click();
  await expect(page.getByText('Maria Ordenhadora', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Registrar pagamento' }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento' }).click();
  await expect(page.getByText('Registrar pagamento')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Financeiro' }).click();
  await expect(page.getByText('Folha salarial — Maria Ordenhadora', { exact: false })).toBeVisible({ timeout: 10_000 });
});
