-- Fase 4: Reprodução (cio, IATF/monta, diagnóstico de prenhez, parto) --
-- um evento por linha na vida reprodutiva da fêmea, mesmo padrão de
-- sanidade_registros (histórico repetido, não campo único no animal).
create table public.reproducao_registros (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animais (id) on delete cascade,
  tipo text not null check (tipo in ('cio', 'inseminacao', 'diagnostico', 'parto')),
  data date not null default current_date,
  touro_ou_semen text,
  resultado text check (resultado in ('prenha', 'vazia') or resultado is null),
  data_prevista_parto date,
  cria_identificacao text,
  observacoes text,
  created_at timestamptz not null default now()
);
create index reproducao_registros_animal_id_data_idx on public.reproducao_registros (animal_id, data);

alter table public.reproducao_registros enable row level security;
grant select, insert, update, delete on public.reproducao_registros to authenticated, service_role;

-- Mesmo desenho de acesso de sanidade/pesagens: qualquer papel da fazenda
-- registra manejo reprodutivo, só administrador/gerente apaga.
create policy reproducao_registros_select_member on public.reproducao_registros
  for select using (
    exists (select 1 from public.animais a where a.id = reproducao_registros.animal_id and public.fazenda_role(a.fazenda_id) is not null)
  );
create policy reproducao_registros_insert_any_role on public.reproducao_registros
  for insert with check (
    exists (select 1 from public.animais a where a.id = reproducao_registros.animal_id and public.fazenda_role(a.fazenda_id) is not null)
  );
create policy reproducao_registros_delete_manager_up on public.reproducao_registros
  for delete using (
    exists (select 1 from public.animais a where a.id = reproducao_registros.animal_id and public.fazenda_role(a.fazenda_id) in ('administrador', 'gerente'))
  );
