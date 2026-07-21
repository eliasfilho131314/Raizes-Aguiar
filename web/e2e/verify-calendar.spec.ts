import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}${Date.now()}@example.com`;
}

test('calendario: tarefa manual + agenda unificada com sanidade e reproducao', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('calendar');

  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome').fill('Produtor Calendario');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Senha/).fill('senha12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Raízes Aguiar' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Criar minha primeira fazenda' }).click();
  await page.waitForURL('**/fazendas', { timeout: 10_000 });
  await page.getByLabel('Nome').fill('Fazenda Calendario Teste');
  await page.getByRole('button', { name: 'Criar fazenda' }).click();
  await expect(page.getByRole('main').getByText('Fazenda Calendario Teste')).toBeVisible({ timeout: 10_000 });

  // Cadastra animal + sanidade com proxima aplicacao, pra aparecer na agenda
  await page.getByRole('link', { name: 'Pecuária' }).click();
  await page.getByLabel('Número').fill('500');
  await page.getByRole('button', { name: 'Cadastrar animal' }).click();
  await expect(page.getByText('Ver pesagens')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Sanidade' }).click();
  await page.getByLabel('Produto/procedimento').fill('Vacina brucelose');
  const future = new Date();
  future.setDate(future.getDate() + 10);
  await page.getByLabel('Próxima aplicação (opcional)').fill(future.toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('Vacina brucelose', { exact: false }).first()).toBeVisible({ timeout: 10_000 });

  // Cria tarefa manual no calendario
  await page.getByRole('link', { name: 'Calendário' }).click();
  await expect(page.getByRole('heading', { name: 'Calendário' })).toBeVisible();
  await page.getByLabel('Título').fill('Consertar cerca do pasto 3');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await expect(page.getByText('Consertar cerca do pasto 3', { exact: false })).toBeVisible({ timeout: 10_000 });

  // A vacina futura aparece junto na mesma agenda
  await expect(page.getByText('Vacina brucelose', { exact: false }).first()).toBeVisible({ timeout: 10_000 });

  // Marcar tarefa como concluida
  await page.getByRole('button', { name: 'Marcar como concluído' }).click();
  await expect(page.getByRole('button', { name: 'Marcar como pendente' })).toBeVisible({ timeout: 10_000 });
});
