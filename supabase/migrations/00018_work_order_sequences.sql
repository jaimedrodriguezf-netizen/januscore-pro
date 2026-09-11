-- 00018_work_order_sequences.sql
-- Atomic consecutive work order numbering per tenant.

-- 1. Add order_number column to maintenance_records if not exists
alter table public.maintenance_records
  add column if not exists order_number text;

create index if not exists idx_maintenance_order_number
  on public.maintenance_records (tenant_id, order_number);

-- 2. Sequence tracker table per tenant
create table if not exists public.tenant_sequences (
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  sequence_type   text not null, -- e.g. 'work_order'
  current_val     bigint not null default 0,
  prefix          text not null default 'OT-',
  padding         integer not null default 4,
  updated_at      timestamptz not null default now(),
  primary key (tenant_id, sequence_type)
);

-- Enable RLS on tenant_sequences
alter table public.tenant_sequences enable row level security;

create policy tenant_sequences_select_auth
  on public.tenant_sequences for select
  to authenticated
  using (tenant_id = any(public.get_my_tenant_ids()));

create policy tenant_sequences_modify
  on public.tenant_sequences for all
  to authenticated
  using (
    public.am_i_platform_admin() 
    or public.am_i_tenant_admin(tenant_id)
    or exists (select 1 from public.branch_memberships bm where bm.user_id = auth.uid() and bm.tenant_id = tenant_id)
  )
  with check (
    public.am_i_platform_admin() 
    or public.am_i_tenant_admin(tenant_id)
    or exists (select 1 from public.branch_memberships bm where bm.user_id = auth.uid() and bm.tenant_id = tenant_id)
  );

-- 3. Backfill order_number for existing records if null
with numbered as (
  select id, row_number() over (partition by tenant_id order by created_at asc, id asc) as rn
  from public.maintenance_records
  where order_number is null
)
update public.maintenance_records m
set order_number = 'OT-' || lpad(numbered.rn::text, 4, '0')
from numbered
where m.id = numbered.id;

-- 4. Initialize tenant sequences counter from existing count
insert into public.tenant_sequences (tenant_id, sequence_type, current_val, prefix, padding)
select 
  tenant_id, 
  'work_order', 
  count(*),
  'OT-',
  4
from public.maintenance_records
group by tenant_id
on conflict (tenant_id, sequence_type) 
do update set 
  current_val = greatest(tenant_sequences.current_val, excluded.current_val),
  updated_at = now();

-- 5. Atomic function to fetch and increment next work order sequence
create or replace function public.get_next_work_order_number(p_tenant_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_next_val bigint;
  v_prefix text;
  v_padding integer;
begin
  insert into public.tenant_sequences (tenant_id, sequence_type, current_val, prefix, padding)
  values (p_tenant_id, 'work_order', 1, 'OT-', 4)
  on conflict (tenant_id, sequence_type)
  do update set 
    current_val = tenant_sequences.current_val + 1,
    updated_at = now()
  returning current_val, prefix, padding into v_next_val, v_prefix, v_padding;

  return v_prefix || lpad(v_next_val::text, v_padding, '0');
end;
$$;

-- 6. Stable peek function for UI preview without incrementing
create or replace function public.peek_next_work_order_number(p_tenant_id uuid)
returns text
language plpgsql
stable
security definer
as $$
declare
  v_curr_val bigint;
  v_prefix text := 'OT-';
  v_padding integer := 4;
begin
  select current_val, prefix, padding 
  into v_curr_val, v_prefix, v_padding
  from public.tenant_sequences
  where tenant_id = p_tenant_id and sequence_type = 'work_order';

  if v_curr_val is null then
    select count(*) into v_curr_val 
    from public.maintenance_records 
    where tenant_id = p_tenant_id;
  end if;

  return coalesce(v_prefix, 'OT-') || lpad(((coalesce(v_curr_val, 0) + 1)::text), coalesce(v_padding, 4), '0');
end;
$$;

create or replace function public.get_next_work_order_number(p_tenant_id text)
returns text language sql security definer as $$
  select public.get_next_work_order_number(p_tenant_id::uuid);
$$;

create or replace function public.peek_next_work_order_number(p_tenant_id text)
returns text language sql stable security definer as $$
  select public.peek_next_work_order_number(p_tenant_id::uuid);
$$;

grant execute on function public.get_next_work_order_number(uuid) to authenticated, service_role;
grant execute on function public.peek_next_work_order_number(uuid) to authenticated, service_role, anon;
grant execute on function public.get_next_work_order_number(text) to authenticated, service_role;
grant execute on function public.peek_next_work_order_number(text) to authenticated, service_role, anon;
