-- Fase 2: Sanidade (vacinas/medicamentos/vermífugos/exames por animal) +
-- detalhamento de saída do animal (venda/abate/morte), que antes era só
-- uma troca de status sem nenhum dado junto.
create table public.sanidade_registros (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animais (id) on delete cascade,
  tipo text not null check (tipo in ('vacina', 'medicamento', 'vermifugo', 'exame', 'outro')),
  produto text not null,
  data date not null default current_date,
  proxima_aplicacao date,
  veterinario text,
  observacoes text,
  created_at timestamptz not null default now()
);
create index sanidade_registros_animal_id_data_idx on public.sanidade_registros (animal_id, data);

alter table public.sanidade_registros enable row level security;
grant select, insert, update, delete on public.sanidade_registros to authenticated, service_role;

create policy sanidade_registros_select_member on public.sanidade_registros
  for select using (
    exists (select 1 from public.animais a where a.id = sanidade_registros.animal_id and public.fazenda_role(a.fazenda_id) is not null)
  );
create policy sanidade_registros_insert_any_role on public.sanidade_registros
  for insert with check (
    exists (select 1 from public.animais a where a.id = sanidade_registros.animal_id and public.fazenda_role(a.fazenda_id) is not null)
  );
create policy sanidade_registros_delete_manager_up on public.sanidade_registros
  for delete using (
    exists (select 1 from public.animais a where a.id = sanidade_registros.animal_id and public.fazenda_role(a.fazenda_id) in ('administrador', 'gerente'))
  );

-- Saída do animal (vendido/abatido/morto): campos únicos o bastante pra
-- cobrir os 3 casos sem tabela por status -- cada animal só sai do
-- rebanho uma vez, não é um histórico repetido (mesmo raciocínio de "não
-- criar abstração além do necessário").
alter table public.animais
  add column data_saida date,
  add column valor_saida numeric,
  add column observacoes_saida text;
