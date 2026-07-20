-- Completa o ciclo compra/venda: hoje só a saída (venda/abate) lança
-- financeiro automático -- a entrada por compra não tinha nem campo de
-- valor nem categoria própria. Backfill roda pra fazendas já existentes
-- também, senão elas nunca ganhariam a categoria nova (seed só roda na
-- criação da fazenda).
alter table public.animais
  add column valor_compra numeric;

create or replace function public.seed_default_finance_categories(p_fazenda_id uuid)
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
    (p_fazenda_id, 'Compra de gado', 'despesa'),
    (p_fazenda_id, 'Ração e suplementos', 'despesa'),
    (p_fazenda_id, 'Medicamentos e vacinas', 'despesa'),
    (p_fazenda_id, 'Combustível', 'despesa'),
    (p_fazenda_id, 'Manutenção de máquinas', 'despesa'),
    (p_fazenda_id, 'Folha salarial', 'despesa'),
    (p_fazenda_id, 'Impostos', 'despesa'),
    (p_fazenda_id, 'Outras despesas', 'despesa');
end;
$$;

insert into public.financeiro_categorias (fazenda_id, name, type)
select f.id, 'Compra de gado', 'despesa'
from public.fazendas f
where not exists (
  select 1 from public.financeiro_categorias c
  where c.fazenda_id = f.id and c.name = 'Compra de gado'
);
