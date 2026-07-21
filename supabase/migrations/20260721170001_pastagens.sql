-- Fase 8: Pastagens (piquetes) -- área, capacidade de suporte e o lote de
-- animais que está ocupando cada um agora (rotação). "lote_atual" é texto
-- livre pra casar com animais.categoria/lote, que também é texto livre --
-- não vira FK porque um piquete pode estar vazio ou com um lote que nunca
-- foi nomeado ainda em nenhum animal.
create table public.pastagens (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas (id) on delete cascade,
  nome text not null,
  area_hectares numeric,
  capacidade_suporte int,
  status text not null default 'em_uso' check (status in ('em_uso', 'descanso')),
  lote_atual text,
  observacoes text,
  created_at timestamptz not null default now()
);
create index pastagens_fazenda_id_idx on public.pastagens (fazenda_id);

alter table public.pastagens enable row level security;
grant select, insert, update, delete on public.pastagens to authenticated, service_role;

-- Rotação de piquete é manejo do dia a dia (mesmo padrão de
-- sanidade/pesagens/agenda): qualquer papel usa, só admin/gerente apaga.
create policy pastagens_select_member on public.pastagens
  for select using (public.fazenda_role(fazenda_id) is not null);
create policy pastagens_insert_any_role on public.pastagens
  for insert with check (public.fazenda_role(fazenda_id) is not null);
create policy pastagens_update_any_role on public.pastagens
  for update using (public.fazenda_role(fazenda_id) is not null);
create policy pastagens_delete_manager_up on public.pastagens
  for delete using (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'));
