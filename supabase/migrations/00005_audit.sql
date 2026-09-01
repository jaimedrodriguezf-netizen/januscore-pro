-- 00005_audit.sql
-- PR5 (Phase 5): Audit logs table, immutability trigger, review columns on receipts + RLS.
-- Implements: R6 (state machine audit trail), R7 (second-person review tracking),
-- and R8 (immutable audit log).

-- ============================================================================
-- Add review columns to receipts
-- ============================================================================
alter table public.receipts
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text;

create index if not exists receipts_reviewed_by_idx on public.receipts (reviewed_by);

-- Scoped UPDATE policy for review state transitions (Phase 5 / R6)
create policy receipts_update_review
  on public.receipts for update
  to authenticated
  using (branch_id = any(public.get_my_branch_ids()))
  with check (branch_id = any(public.get_my_branch_ids()));

-- ============================================================================
-- audit_logs (append-only immutable audit trail)
-- ============================================================================
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  branch_id   uuid references public.branches(id) on delete set null,
  actor_id    uuid references public.profiles(id) on delete set null,
  target_type text not null,
  target_id   uuid not null,
  action      text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default clock_timestamp()
);

create index if not exists audit_logs_target_idx
  on public.audit_logs (target_type, target_id, created_at desc);
create index if not exists audit_logs_tenant_branch_idx
  on public.audit_logs (tenant_id, branch_id, created_at desc);
create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_id, created_at desc);

-- ============================================================================
-- Immutability enforcement (R8): UPDATE and DELETE raise exceptions
-- ============================================================================
create or replace function public.audit_logs_immutable()
returns trigger
language plpgsql
security definer
as $$
begin
  raise exception 'audit_logs entries are immutable and cannot be modified or deleted';
end;
$$;

drop trigger if exists audit_logs_no_update on public.audit_logs;
create trigger audit_logs_no_update
  before update on public.audit_logs
  for each row execute function public.audit_logs_immutable();

drop trigger if exists audit_logs_no_delete on public.audit_logs;
create trigger audit_logs_no_delete
  before delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.audit_logs enable row level security;

-- SELECT: tenant members can read audit logs for their tenant
create policy audit_logs_select
  on public.audit_logs for select
  to authenticated
  using (tenant_id = any(public.get_my_tenant_ids()));

-- INSERT: authenticated operators can append audit logs within their tenant
create policy audit_logs_insert
  on public.audit_logs for insert
  to authenticated
  with check (tenant_id = any(public.get_my_tenant_ids()));

-- Defensive: revoke permissions
revoke update, delete on public.audit_logs from authenticated;
revoke all on public.audit_logs from anon;
