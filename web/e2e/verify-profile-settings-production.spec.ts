import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://raizes-aguiar.vercel.app' });

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('producao: perfil/configuracoes + recarregar pagina numa rota profunda nao perde o lugar', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('prodprofile');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Producao Profile');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 15_000 });
  await page.getByLabel('Nome').fill('Fazenda Prod Profile');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Prod Profile')).toBeVisible({ timeout: 10_000 });

  // Bug antigo: recarregar direto numa rota que nao "/" perdia o lugar e
  // caia no Dashboard.
  await page.goto('/configuracoes', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/configuracoes$/);

  await page.getByLabel('Nova senha', { exact: true }).fill('novasenha123');
  await page.getByLabel('Confirmar nova senha').fill('novasenha123');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByText('Senha atualizada.')).toBeVisible({ timeout: 10_000 });

  await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('Nome').fill('Nome Atualizado Prod');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Salvo.')).toBeVisible({ timeout: 10_000 });
});
