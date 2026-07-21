import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('relatorios: rebanho por categoria e grafico financeiro', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('reports');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Relatorios');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Relatorios Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Relatorios Teste')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('600');
  await page.getByLabel('Categoria').selectOption('vaca');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Ver pesagens')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Financeiro' }).click();
  await page.getByRole('button', { name: 'Receita' }).click();
  await page.getByLabel('Valor (R$)').fill('1500');
  await page.getByLabel('Descrição (opcional)').fill('Venda de leite');
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByText('Venda de leite', { exact: true }).last()).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Relatórios' }).click();
  await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();
  await expect(page.getByText('Rebanho ativo por categoria')).toBeVisible();
  await expect(page.getByText('Vaca', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Receitas x despesas', { exact: false })).toBeVisible();
});
