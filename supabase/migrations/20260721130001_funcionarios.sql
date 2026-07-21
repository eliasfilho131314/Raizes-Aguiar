-- Fase 6: Funcionários (registro de RH -- cargo/salário/admissão), distinto
-- de fazenda_membros (que é acesso ao sistema). Contém salário, então
-- segue a mesma régua do Financeiro: "sem acesso financeiro" pro
-- funcionário (PERFIS DE ACESSO) cobre também ver a folha dos colegas.
-- Pagamento não ganha tabela própria -- vira direto um lançamento de
-- despesa em financeiro_transacoes (mesmo padrão de compra de animal e
-- entrada de estoque), sem duplicar o dado em dois lugares.
create table public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas (id) on delete cascade,
  nome text not null,
  cargo text,
  salario numeric,
  telefone text,
  data_admissao date,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create index funcionarios_fazenda_id_idx on public.funcionarios (fazenda_id);

alter table public.funcionarios enable row level security;
grant select, insert, update, delete on public.funcionarios to authenticated, service_role;

create policy funcionarios_manager_up on public.funcionarios
  for all using (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'))
  with check (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'));
