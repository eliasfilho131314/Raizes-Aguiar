-- Fase 5: Estoque (ração, medicamentos, combustível, insumos). Quantidade
-- atual fica desnormalizada no item (soma de entradas - saídas) porque é
-- lida o tempo todo (lista principal) e escrita raramente (uma movimentação
-- por vez) -- recalcular via SUM a cada leitura seria caro sem ganho real.
create table public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas (id) on delete cascade,
  nome text not null,
  categoria text not null check (categoria in ('racao', 'medicamento', 'combustivel', 'outro')),
  unidade text not null default 'un',
  quantidade_atual numeric not null default 0,
  quantidade_minima numeric,
  created_at timestamptz not null default now()
);
create index estoque_itens_fazenda_id_idx on public.estoque_itens (fazenda_id);

create table public.estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.estoque_itens (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  quantidade numeric not null check (quantidade > 0),
  valor_total numeric,
  data date not null default current_date,
  observacoes text,
  created_at timestamptz not null default now()
);
create index estoque_movimentos_item_id_data_idx on public.estoque_movimentos (item_id, data);

alter table public.estoque_itens enable row level security;
alter table public.estoque_movimentos enable row level security;

grant select, insert, update, delete on public.estoque_itens to authenticated, service_role;
grant select, insert, update, delete on public.estoque_movimentos to authenticated, service_role;

-- Estoque é adjacente a compras/financeiro (entrada pode lançar despesa) --
-- mesma régua de acesso do Financeiro: qualquer membro só lê, admin/gerente
-- movimenta. Diferente de sanidade/pesagens, onde funcionário também
-- registra.
create policy estoque_itens_select_member on public.estoque_itens
  for select using (public.fazenda_role(fazenda_id) is not null);
create policy estoque_itens_manager_up on public.estoque_itens
  for all using (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'))
  with check (public.fazenda_role(fazenda_id) in ('administrador', 'gerente'));

create policy estoque_movimentos_select_member on public.estoque_movimentos
  for select using (
    exists (select 1 from public.estoque_itens i where i.id = estoque_movimentos.item_id and public.fazenda_role(i.fazenda_id) is not null)
  );
create policy estoque_movimentos_manager_up on public.estoque_movimentos
  for all using (
    exists (select 1 from public.estoque_itens i where i.id = estoque_movimentos.item_id and public.fazenda_role(i.fazenda_id) in ('administrador', 'gerente'))
  )
  with check (
    exists (select 1 from public.estoque_itens i where i.id = estoque_movimentos.item_id and public.fazenda_role(i.fazenda_id) in ('administrador', 'gerente'))
  );

-- Toda movimentação atualiza a quantidade desnormalizada do item -- fica
-- em trigger (não no client) pra não depender de duas chamadas
-- sequenciais nem correr risco de ordem de execução divergente entre
-- múltiplas abas/usuários.
create function public.apply_estoque_movimento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo = 'entrada' then
    update public.estoque_itens set quantidade_atual = quantidade_atual + new.quantidade where id = new.item_id;
  else
    update public.estoque_itens set quantidade_atual = quantidade_atual - new.quantidade where id = new.item_id;
  end if;
  return new;
end;
$$;

create trigger estoque_movimentos_apply
  after insert on public.estoque_movimentos
  for each row execute function public.apply_estoque_movimento();
