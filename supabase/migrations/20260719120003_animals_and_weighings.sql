-- Fase 1: cadastro individual de animal + pesagens. categoria/raça ficam
-- text livre (lista fixa vem do front, igual ao padrão já usado no
-- Goggins Effect pra category/type) -- fácil adicionar categoria nova sem
-- migration. status controla o ciclo de vida (ativo/vendido/abatido/morto).
create type public.animal_sexo_type as enum ('macho', 'femea');
create type public.animal_status_type as enum ('ativo', 'vendido', 'abatido', 'morto');

create table public.animais (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas (id) on delete cascade,
  numero text,
  brinco text,
  nome text,
  sexo public.animal_sexo_type not null,
  raca text,
  categoria text not null,
  lote text,
  data_nascimento date,
  peso_nascimento_kg numeric,
  origem text,
  status public.animal_status_type not null default 'ativo',
  observacoes text,
  created_at timestamptz not null default now()
);
create index animais_fazenda_id_idx on public.animais (fazenda_id);

create table public.pesagens (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animais (id) on delete cascade,
  data date not null default current_date,
  peso_kg numeric not null,
  observacoes text,
  created_at timestamptz not null default now()
);
create index pesagens_animal_id_data_idx on public.pesagens (animal_id, data);

alter table public.animais enable row level security;
alter table public.pesagens enable row level security;

grant select, insert, update, delete on public.animais to authenticated, service_role;
grant select, insert, update, delete on public.pesagens to authenticated, service_role;

-- Qualquer membro da fazenda vê os animais. Registrar (insert) é permitido
-- pra administrador/gerente/funcionário (funcionário "registra nascimento"
-- por conta própria, ver PERFIS DE ACESSO); editar/apagar já exige gerente
-- pra cima.
create policy animais_select_member on public.animais
  for select using (public.fazenda_role(fazenda_id) is not null);
create policy animais_insert_any_role on public.animais
  for insert with check (public.fazenda_role(fazenda_id) is not null);
create policy animais_update_manager_up on public.animais
  for update using (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'));
create policy animais_delete_manager_up on public.animais
  for delete using (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'));

create policy pesagens_select_member on public.pesagens
  for select using (
    exists (select 1 from public.animais a where a.id = pesagens.animal_id and public.fazenda_role(a.fazenda_id) is not null)
  );
create policy pesagens_insert_any_role on public.pesagens
  for insert with check (
    exists (select 1 from public.animais a where a.id = pesagens.animal_id and public.fazenda_role(a.fazenda_id) is not null)
  );
create policy pesagens_update_manager_up on public.pesagens
  for update using (
    exists (select 1 from public.animais a where a.id = pesagens.animal_id and public.fazenda_role(a.fazenda_id) in ('administrador', 'gerente'))
  );
create policy pesagens_delete_manager_up on public.pesagens
  for delete using (
    exists (select 1 from public.animais a where a.id = pesagens.animal_id and public.fazenda_role(a.fazenda_id) in ('administrador', 'gerente'))
  );
