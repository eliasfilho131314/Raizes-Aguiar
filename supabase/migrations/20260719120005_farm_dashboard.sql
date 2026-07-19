-- Fase 1: indicadores agregados do Dashboard num round-trip só. Financeiro
-- some pra funcionário (zero acesso, mesma regra das tabelas financeiras).
create function public.get_farm_dashboard(p_fazenda_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.fazenda_role_type := public.fazenda_role(p_fazenda_id);
  v_total int;
  v_machos int;
  v_femeas int;
  v_ativos int;
  v_vendidos int;
  v_abatidos int;
  v_mortos int;
  v_receitas numeric := 0;
  v_despesas numeric := 0;
begin
  if v_role is null then
    raise exception 'Você não tem acesso a esta fazenda.';
  end if;

  select
    count(*),
    count(*) filter (where sexo = 'macho'),
    count(*) filter (where sexo = 'femea'),
    count(*) filter (where status = 'ativo'),
    count(*) filter (where status = 'vendido'),
    count(*) filter (where status = 'abatido'),
    count(*) filter (where status = 'morto')
  into v_total, v_machos, v_femeas, v_ativos, v_vendidos, v_abatidos, v_mortos
  from public.animais where fazenda_id = p_fazenda_id;

  if v_role <> 'funcionario' then
    select coalesce(sum(amount) filter (where type = 'receita'), 0),
           coalesce(sum(amount) filter (where type = 'despesa'), 0)
    into v_receitas, v_despesas
    from public.financeiro_transacoes
    where fazenda_id = p_fazenda_id and date_trunc('month', date) = date_trunc('month', current_date);
  end if;

  return jsonb_build_object(
    'totalAnimals', v_total,
    'machos', v_machos,
    'femeas', v_femeas,
    'ativos', v_ativos,
    'vendidos', v_vendidos,
    'abatidos', v_abatidos,
    'mortos', v_mortos,
    'receitas', v_receitas,
    'despesas', v_despesas,
    'lucro', v_receitas - v_despesas
  );
end;
$$;
