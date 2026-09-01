-- 00004_qr.sql
-- PR4 (Phase 4): QR + Ed25519 verification tables + branch-scoped RLS.
-- Implements: R3 (QR decode + Ed25519 verify; v1 Banco Pichincha only; parser
-- pluggable via lib/qr/parser.ts) and R4 (fraud flag on verification failure).
--
-- Self-contained for PR4: references only tables created here or earlier
-- (receipts, tenants, branches, get_my_branch_ids / get_my_tenant_ids helpers
-- from 00001/00002). The admin CRUD surface for bank_public_keys (R14) and the
-- beneficiary_configs table (R5) land in later phases (forward links below).
--
-- Forward links (do NOT implement here):
--   * Phase 5 (00005_audit.sql): audit_logs for the QR failure path.
--   * Phase 5: review UI surfaces receipts.fraud_flag (R4 propagation).
--   * Phase 7 (00006_admin.sql): beneficiary_configs (R5) + bank_public_keys
--     admin INSERT/UPDATE policies + deactivation UI (R14). PR4 ships the
--     is_active column and the read path so the verify pipeline can filter
--     is_active = true; deactivation naturally disables verification (task 7.5
--     RED test exercises that the pipeline no longer finds an active key).

-- ============================================================================
-- receipts.fraud_flag (R4): set true on Ed25519 verification FAILURE only.
-- Unsupported bank (R3) and no-key-configured (R3) route to review WITHOUT the
-- fraud flag (those are not signature failures). Default false. The service
-- client (verify pipeline) bypasses RLS to UPDATE this column.
-- ============================================================================
alter table public.receipts
  add column if not exists fraud_flag boolean not null default false;

-- ============================================================================
-- bank_public_keys (R3 / R14): tenant-configured Ed25519 public keys per bank.
-- v1: one active row per (tenant_id, bank='Pichincha'). is_active lets an admin
-- deactivate a key (R14) — the verify pipeline filters is_active = true, so a
-- deactivated key is invisible to verification (no incomplete path). Admin CRUD
-- policies arrive in Phase 7; PR4 ships RLS SELECT (tenant-scoped) + revoke anon
-- so the service client can read and operators/admins can list their own keys.
-- ============================================================================
create table if not exists public.bank_public_keys (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  bank          text not null,                  -- 'Pichincha' (canonical, v1)
  public_key    text not null,                  -- hex-encoded Ed25519 (32 bytes)
  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  deactivated_at timestamptz
);

-- One active key per (tenant, bank). A deactivated row has is_active=false and
-- does not conflict with a later active row for the same bank.
create unique index if not exists bank_public_keys_one_active
  on public.bank_public_keys (tenant_id, bank) where is_active;

create index if not exists bank_public_keys_tenant_idx
  on public.bank_public_keys (tenant_id, bank, is_active);

alter table public.bank_public_keys enable row level security;

-- SELECT: a tenant member sees their tenant's bank keys (R16 tenant isolation).
create policy bank_public_keys_select
  on public.bank_public_keys for select
  to authenticated
  using (tenant_id = any(public.get_my_tenant_ids()));

-- No INSERT/UPDATE/DELETE policies in PR4 (admin UI lands in Phase 7 / R14).
-- Default deny for authenticated; the service client (verify pipeline) bypasses
-- RLS to read. Phase 7 will add scoped INSERT/UPDATE (deactivate) policies.

-- ============================================================================
-- qr_verifications (immutable history; one row per QR verification attempt).
-- status: verified (signature valid) | failed (signature present, did not match
-- — R4 fraud) | unsupported (R3 non-Pichincha QR) | incomplete (R3 no key
-- configured for the detected bank).
-- ============================================================================
create table if not exists public.qr_verifications (
  id            uuid primary key default gen_random_uuid(),
  receipt_id    uuid not null references public.receipts(id) on delete cascade,
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  branch_id     uuid not null references public.branches(id) on delete cascade,
  parser_name   text not null,                  -- 'pichincha' | 'generic'
  bank          text not null,                  -- detected bank: 'Pichincha' | 'unknown'
  fields        jsonb not null default '{}'::jsonb,
  signed_data   text,                           -- the bytes covered by the signature
  signature     text,                           -- hex signature (null if unsigned)
  status        text not null
                check (status in ('verified','failed','unsupported','incomplete')),
  public_key_id uuid references public.bank_public_keys(id) on delete set null,
  error         text,                           -- human-readable failure detail
  created_at    timestamptz not null default now(),
  verified_at   timestamptz
);

create index if not exists qr_verifications_receipt_idx
  on public.qr_verifications (receipt_id, created_at desc);
create index if not exists qr_verifications_tenant_branch_idx
  on public.qr_verifications (tenant_id, branch_id, created_at desc);
create index if not exists qr_verifications_status_idx
  on public.qr_verifications (status);

alter table public.qr_verifications enable row level security;

-- SELECT: an operator sees QR verifications for receipts at their branches
-- (R16 branch membership implies tenant membership → tenant isolation).
create policy qr_verifications_select
  on public.qr_verifications for select
  to authenticated
  using (branch_id = any(public.get_my_branch_ids()));

-- INSERT: an authenticated operator at the owning branch may insert directly
-- (the route also uses the service role for background QR, which bypasses RLS).
create policy qr_verifications_insert
  on public.qr_verifications for insert
  to authenticated
  with check (branch_id = any(public.get_my_branch_ids()));

-- No UPDATE/DELETE policies: QR verification rows are immutable history.
-- Default deny. Service role can still prune history.

-- ============================================================================
-- Defensive: no anonymous access to QR-scoped tables.
-- ============================================================================
revoke all on public.bank_public_keys  from anon;
revoke all on public.qr_verifications  from anon;