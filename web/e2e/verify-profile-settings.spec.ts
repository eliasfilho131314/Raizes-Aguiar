import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('perfil: editar nome + configuracoes: trocar senha', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('profile');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Nome Original');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Profile Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Profile Teste')).toBeVisible({ timeout: 10_000 });

  // Abre o menu do avatar e vai pro Perfil
  await page.locator('header button.rounded-full').click();
  await page.getByRole('button', { name: 'Perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible();
  await expect(page.getByLabel('E-mail')).toHaveValue(email);

  await page.getByLabel('Nome').fill('Nome Atualizado');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Salvo.')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('header')).toContainText('N');

  // Configuracoes: trocar senha
  await page.goto('/configuracoes', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible();
  await page.getByLabel('Nova senha', { exact: true }).fill('novasenha123');
  await page.getByLabel('Confirmar nova senha').fill('novasenha123');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByText('Senha atualizada.')).toBeVisible({ timeout: 10_000 });
});
