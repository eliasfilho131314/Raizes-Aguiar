import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('reproducao: cio, inseminacao, diagnostico prenha e parto', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('repro');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Reproducao');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Reproducao Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Reproducao Teste')).toBeVisible({ timeout: 10_000 });

  // Cadastra uma femea ativa
  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('300');
  await page.getByLabel('Brinco').fill('R300');
  await page.getByLabel('Sexo').selectOption('femea');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Brinco R300', { exact: false })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Reprodução' }).click();
  await expect(page.getByRole('heading', { name: 'Reprodução' })).toBeVisible();

  // Inseminacao
  await page.getByLabel('Tipo').selectOption('inseminacao');
  await page.getByLabel('Touro/sêmen').fill('Sêmen Nelore XP-12');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('Sêmen Nelore XP-12', { exact: false })).toBeVisible({ timeout: 10_000 });

  // Diagnostico prenha -- confere sugestao automatica de data prevista
  await page.getByLabel('Tipo').selectOption('diagnostico');
  await expect(page.getByLabel('Previsão de parto')).not.toHaveValue('');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('previsão:', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Partos previstos')).toBeVisible();

  // Parto
  await page.getByLabel('Tipo').selectOption('parto');
  await page.getByLabel('Identificação da cria (opcional)').fill('Bezerra R300-1');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('Bezerra R300-1', { exact: false })).toBeVisible({ timeout: 10_000 });
});
