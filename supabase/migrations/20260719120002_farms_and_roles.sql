-- Fase 1: núcleo multi-fazenda. Cada fazenda isola completamente seus
-- próprios dados (animais, financeiro, etc.) -- fazenda_membros é o join
-- table que define QUEM enxerga QUAL fazenda e com QUE papel
-- (administrador/gerente/funcionario, ver PERFIS DE ACESSO do prompt).
create table public.fazendas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  area_hectares numeric,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create type public.fazenda_role_type as enum ('administrador', 'gerente', 'funcionario');

create table public.fazenda_membros (
  fazenda_id uuid not null references public.fazendas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.fazenda_role_type not null,
  joined_at timestamptz not null default now(),
  primary key (fazenda_id, user_id)
);

alter table public.fazendas enable row level security;
alter table public.fazenda_membros enable row level security;

-- fazenda_role: choke-point único pra "qual o meu papel nesta fazenda".
-- SECURITY DEFINER pra não recursar com a própria RLS de fazenda_membros
-- quando outras policies chamarem esta função.
create function public.fazenda_role(p_fazenda_id uuid)
returns public.fazenda_role_type
language sql
security definer
stable
set search_path = public
as $$
  select role from public.fazenda_membros
  where fazenda_id = p_fazenda_id and user_id = auth.uid();
$$;

create policy fazendas_select_member on public.fazendas
  for select using (public.fazenda_role(id) is not null);
create policy fazendas_update_admin on public.fazendas
  for update using (public.fazenda_role(id) = 'administrador');
create policy fazendas_delete_admin on public.fazendas
  for delete using (public.fazenda_role(id) = 'administrador');
-- Sem policy de insert direta -- criar fazenda passa por create_farm()
-- (precisa inserir a membership de administrador do criador atomicamente).

create policy fazenda_membros_select_own_farms on public.fazenda_membros
  for select using (public.fazenda_role(fazenda_id) is not null);
create policy fazenda_membros_insert_admin on public.fazenda_membros
  for insert with check (public.fazenda_role(fazenda_id) = 'administrador');
create policy fazenda_membros_update_admin on public.fazenda_membros
  for update using (public.fazenda_role(fazenda_id) = 'administrador');
create policy fazenda_membros_delete_admin on public.fazenda_membros
  for delete using (public.fazenda_role(fazenda_id) = 'administrador');

grant select, update, delete on public.fazendas to authenticated;
grant select, insert, update, delete on public.fazendas to service_role;
grant select, insert, update, delete on public.fazenda_membros to authenticated, service_role;

-- Um usuário pode ver nome/e-mail de quem divide alguma fazenda com ele
-- (roster da fazenda) -- sem isso, a lista de funcionários mostraria só
-- IDs. Consulta fazenda_membros diretamente (RLS dela já resolve o acesso
-- via fazenda_role, sem recursão -- fazenda_role bypassa RLS por ser
-- SECURITY DEFINER).
create policy profiles_select_farm_members on public.profiles
  for select using (
    exists (
      select 1 from public.fazenda_membros fm1
      join public.fazenda_membros fm2 on fm1.fazenda_id = fm2.fazenda_id
      where fm1.user_id = auth.uid() and fm2.user_id = profiles.id
    )
  );

-- create_farm: único jeito de criar fazenda -- insere a fazenda e já
-- torna o criador administrador dela, atomicamente (sem isso, o criador
-- não teria nenhuma linha em fazenda_membros pra sequer enxergar a
-- fazenda que acabou de criar, já que fazendas_select_member exige
-- fazenda_role() não nulo).
create function public.create_farm(
  p_name text,
  p_location text default null,
  p_area_hectares numeric default null
)
returns public.fazendas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_farm public.fazendas;
begin
  insert into public.fazendas (name, location, area_hectares, created_by)
  values (p_name, p_location, p_area_hectares, auth.uid())
  returning * into v_farm;

  insert into public.fazenda_membros (fazenda_id, user_id, role)
  values (v_farm.id, auth.uid(), 'administrador');

  return v_farm;
end;
$$;

-- invite_farm_member: só administrador convida, e só quem já tem conta
-- (Fase 1 -- convite por e-mail de quem ainda não existe fica pra depois).
create function public.invite_farm_member(
  p_fazenda_id uuid,
  p_email text,
  p_role public.fazenda_role_type
)
returns public.fazenda_membros
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_id uuid;
  v_member public.fazenda_membros;
begin
  if public.fazenda_role(p_fazenda_id) <> 'administrador' then
    raise exception 'Só o administrador da fazenda pode convidar membros.';
  end if;

  select id into v_target_id from public.profiles where email = p_email;
  if v_target_id is null then
    raise exception 'Nenhuma conta encontrada com o e-mail %.', p_email;
  end if;

  insert into public.fazenda_membros (fazenda_id, user_id, role)
  values (p_fazenda_id, v_target_id, p_role)
  on conflict (fazenda_id, user_id) do update set role = excluded.role
  returning * into v_member;

  return v_member;
end;
$$;
