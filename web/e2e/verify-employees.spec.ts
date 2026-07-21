import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('funcionarios: cadastro, pagamento lanca despesa, desativar', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('employee');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Funcionarios');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Funcionarios Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Funcionarios Teste')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Funcionários' }).click();
  await expect(page.getByRole('heading', { name: 'Funcionários' })).toBeVisible();

  await page.getByLabel('Nome').fill('João Vaqueiro');
  await page.getByLabel('Cargo (opcional)').fill('Vaqueiro');
  await page.getByLabel('Salário (R$, opcional)').fill('2200');
  await page.getByRole('button', { name: 'Cadastrar funcionário' }).click();
  await expect(page.getByText('João Vaqueiro', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('2.200,00', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Registrar pagamento' }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento' }).click();
  await expect(page.getByText('Registrar pagamento')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Financeiro' }).click();
  await expect(page.getByText('Folha salarial — João Vaqueiro', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Funcionários' }).click();
  await page.getByText('Ativo', { exact: true }).click();
  await expect(page.getByText('Inativo', { exact: true })).toBeVisible({ timeout: 10_000 });
});
