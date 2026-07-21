-- Fase 7: Calendário -- agenda de tarefas/eventos próprios da fazenda.
-- Vacinação futura (sanidade_registros.proxima_aplicacao) e parto previsto
-- (reproducao_registros.data_prevista_parto) já existem e continuam lidos
-- direto das tabelas de origem (sem duplicar dado); esta tabela é só pra
-- itens que não têm módulo próprio (lembretes, tarefas manuais).
create table public.eventos_agenda (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas (id) on delete cascade,
  titulo text not null,
  data date not null default current_date,
  tipo text not null check (tipo in ('tarefa', 'evento')),
  concluido boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now()
);
create index eventos_agenda_fazenda_id_data_idx on public.eventos_agenda (fazenda_id, data);

alter table public.eventos_agenda enable row level security;
grant select, insert, update, delete on public.eventos_agenda to authenticated, service_role;

-- Mesmo desenho de sanidade/pesagens: qualquer papel da fazenda usa a
-- agenda no dia a dia, só administrador/gerente apaga.
create policy eventos_agenda_select_member on public.eventos_agenda
  for select using (public.fazenda_role(fazenda_id) is not null);
create policy eventos_agenda_insert_any_role on public.eventos_agenda
  for insert with check (public.fazenda_role(fazenda_id) is not null);
create policy eventos_agenda_update_any_role on public.eventos_agenda
  for update using (public.fazenda_role(fazenda_id) is not null);
create policy eventos_agenda_delete_manager_up on public.eventos_agenda
  for delete using (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'));
