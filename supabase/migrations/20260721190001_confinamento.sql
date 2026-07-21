-- Fase 9: Confinamento -- lotes de engorda (curral), separado de
-- Pastagens porque o ciclo de vida é diferente: entrada com peso médio,
-- meta de saída, consumo de ração estimado, depois "finalizado" (não
-- rotaciona indefinidamente como um piquete).
create table public.confinamento_lotes (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas (id) on delete cascade,
  nome text not null,
  data_entrada date not null default current_date,
  data_saida_prevista date,
  quantidade_animais int not null default 0,
  peso_medio_entrada_kg numeric,
  consumo_racao_kg_dia numeric,
  status text not null default 'ativo' check (status in ('ativo', 'finalizado')),
  observacoes text,
  created_at timestamptz not null default now()
);
create index confinamento_lotes_fazenda_id_idx on public.confinamento_lotes (fazenda_id);

alter table public.confinamento_lotes enable row level security;
grant select, insert, update, delete on public.confinamento_lotes to authenticated, service_role;

-- Mesmo desenho de manejo de pastagens/sanidade/pesagens: qualquer papel
-- da fazenda cria/atualiza, só admin/gerente apaga.
create policy confinamento_lotes_select_member on public.confinamento_lotes
  for select using (public.fazenda_role(fazenda_id) is not null);
create policy confinamento_lotes_insert_any_role on public.confinamento_lotes
  for insert with check (public.fazenda_role(fazenda_id) is not null);
create policy confinamento_lotes_update_any_role on public.confinamento_lotes
  for update using (public.fazenda_role(fazenda_id) is not null);
create policy confinamento_lotes_delete_manager_up on public.confinamento_lotes
  for delete using (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'));
