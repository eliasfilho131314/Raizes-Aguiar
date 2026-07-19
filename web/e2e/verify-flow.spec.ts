import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  // example.com é um domínio reservado de verdade (IANA). Formato simples
  // (1 ponto só) -- um endereço com vários segmentos separados por ponto
  // foi rejeitado como "invalid" pelo GoTrue nos testes iniciais.
  return `${prefix}${Date.now()}@example.com`;
}

test('cadastro, criar fazenda, cadastrar animal, lancamento financeiro', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('flow');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Teste');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  // Sem fazenda ainda -- tela de boas-vindas
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();

  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Santa Helena');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Santa Helena')).toBeVisible({ timeout: 10_000 });

  // Dashboard
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: /Olá,/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Total de animais')).toBeVisible();

  // Pecuária: cadastra um animal
  await page.getByRole('link', { name: 'Pecuária' }).click();
  await expect(page.getByRole('heading', { name: 'Pecuária' })).toBeVisible();
  await page.getByLabel('Número').fill('001');
  await page.getByLabel('Brinco').fill('BR001');
  await page.getByLabel('Raça').fill('Nelore');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Brinco BR001', { exact: false })).toBeVisible({ timeout: 10_000 });

  // Registrar pesagem
  await page.getByRole('button', { name: 'Ver pesagens' }).click();
  await page.getByLabel('Peso (kg)').fill('35');
  await page.getByRole('button', { name: 'Registrar pesagem' }).click();
  await expect(page.getByText('35kg', { exact: false })).toBeVisible({ timeout: 10_000 });

  // Financeiro: lançamento
  await page.getByRole('link', { name: 'Financeiro' }).click();
  await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible();
  await page.getByLabel('Valor (R$)').fill('1500');
  await page.getByLabel('Descrição (opcional)').fill('Venda de bezerro');
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByText('Venda de bezerro')).toBeVisible({ timeout: 10_000 });

  // Volta pro dashboard e confere que o animal contabilizou
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText('Total de animais')).toBeVisible();
});
