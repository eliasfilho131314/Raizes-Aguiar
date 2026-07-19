-- Fase 1: financeiro básico (categorias + lançamentos). Funcionário não
-- tem NENHUM acesso aqui (ver PERFIS DE ACESSO do prompt: "Sem acesso
-- financeiro") -- só administrador/gerente em todas as operações,
-- inclusive select.
create table public.financeiro_categorias (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas (id) on delete cascade,
  name text not null,
  type text not null check (type in ('receita', 'despesa'))
);
create index financeiro_categorias_fazenda_id_idx on public.financeiro_categorias (fazenda_id);

create table public.financeiro_transacoes (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas (id) on delete cascade,
  type text not null check (type in ('receita', 'despesa')),
  categoria_id uuid references public.financeiro_categorias (id) on delete set null,
  amount numeric not null,
  description text,
  date date not null default current_date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index financeiro_transacoes_fazenda_id_date_idx on public.financeiro_transacoes (fazenda_id, date);

alter table public.financeiro_categorias enable row level security;
alter table public.financeiro_transacoes enable row level security;

grant select, insert, update, delete on public.financeiro_categorias to authenticated, service_role;
grant select, insert, update, delete on public.financeiro_transacoes to authenticated, service_role;

create policy financeiro_categorias_manager_up on public.financeiro_categorias
  for all using (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'))
  with check (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'));

create policy financeiro_transacoes_manager_up on public.financeiro_transacoes
  for all using (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'))
  with check (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'));

-- Categorias padrão -- espelham uma fração das DESPESAS/RECEITAS listadas
-- no prompt (lista fixa inicial; usuário pode cadastrar quantas quiser
-- depois, direto pela UI, sem RPC nem migration nova).
create function public.seed_default_finance_categories(p_fazenda_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.financeiro_categorias (fazenda_id, name, type) values
    (p_fazenda_id, 'Venda de gado', 'receita'),
    (p_fazenda_id, 'Venda de leite', 'receita'),
    (p_fazenda_id, 'Outras receitas', 'receita'),
    (p_fazenda_id, 'Ração e suplementos', 'despesa'),
    (p_fazenda_id, 'Medicamentos e vacinas', 'despesa'),
    (p_fazenda_id, 'Combustível', 'despesa'),
    (p_fazenda_id, 'Manutenção de máquinas', 'despesa'),
    (p_fazenda_id, 'Folha salarial', 'despesa'),
    (p_fazenda_id, 'Impostos', 'despesa'),
    (p_fazenda_id, 'Outras despesas', 'despesa');
end;
$$;
