-- PERFIS DE ACESSO do prompt: funcionário registra "mortalidade" por conta
-- própria, mas a única policy de update em animais exigia admin/gerente
-- pra QUALQUER mudança (inclusive marcar morte) -- bloqueando exatamente
-- o caso que devia ser permitido. Venda/abate continuam exclusivos de
-- admin/gerente (geram lançamento financeiro, funcionário não tem acesso).
-- Múltiplas políticas permissivas pro mesmo comando se combinam com OR
-- (tanto USING quanto WITH CHECK) -- por isso dá pra somar essa policy
-- sem afrouxar a existente.
create policy animais_update_mortality_any_role on public.animais
  for update using (public.fazenda_role(fazenda_id) is not null)
  with check (status = 'morto');
