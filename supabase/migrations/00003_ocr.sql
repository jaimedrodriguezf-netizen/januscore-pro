-- 00003_ocr.sql
-- PR3 (Phase 3): extraction_results table + branch-scoped RLS.
-- Implements: R2 (server-side OCR; extraction is a hint, never trusted blindly;
-- engine swappable via abstract interface in lib/ocr/engine.ts).
--
-- Self-contained for PR3: references only tables created here or earlier
-- (receipts, receipt_files from 00002; tenants, branches, get_my_branch_ids
-- helper from 00001). beneficiary_configs does NOT exist yet (lands in
-- 00006_admin.sql, Phase 7), so R5 beneficiary matching is wired structurally
-- in the extract route but its persistence config is deferred — PR3 persists
-- the OCR extraction_result and the route leaves receipts.status untouched on
-- a complete extraction (no auto-approve) and sets needs_review on partial /
-- failed per R2's "partial results stored, receipt flagged for human review".
--
-- RLS: the service-role background job (run via `after`) bypasses RLS to WRITE
-- extraction_results. SELECT/INSERT policies mirror receipts_select so an
-- authenticated operator only sees extractions for receipts in their branches.

-- ============================================================================
-- extraction_results (one logical OCR run per receipt; appends re-runs later)
-- ============================================================================
create table if not exists public.extraction_results (
  id           uuid primary key default gen_random_uuid(),
  receipt_id   uuid not null references public.receipts(id) on delete cascade,
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  branch_id   uuid not null references public.branches(id) on delete cascade,
  engine_name  text not null,
  -- R2: structured fields are a HINT, never trusted blindly. raw_text keeps the
  -- full OCR output so a later engine swap (R2 RED) can re-parse without re-OCR.
  fields       jsonb not null default '{}'::jsonb,
  confidence   jsonb not null default '{}'::jsonb,
  raw_text     text not null default '',
  status       text not null default 'failed'
               check (status in ('complete', 'partial', 'failed')),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists extraction_results_receipt_idx
  on public.extraction_results (receipt_id, created_at desc);
create index if not exists extraction_results_tenant_branch_idx
  on public.extraction_results (tenant_id, branch_id, created_at desc);
create index if not exists extraction_results_engine_idx
  on public.extraction_results (engine_name);
-- A receipt has at most one extraction per engine (re-runs UPDATE in place or
-- append re-run rows; v1 keeps the latest authoritative row findable by
-- created_at desc — no unique constraint to allow re-runs).
create index if not exists extraction_results_latest
  on public.extraction_results (receipt_id, created_at desc, engine_name);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.extraction_results enable row level security;

-- SELECT: an operator sees extractions for receipts at branches they can access
-- (R16 branch membership implies tenant membership → tenant isolation).
create policy extraction_results_select
  on public.extraction_results for select
  to authenticated
  using (branch_id = any(public.get_my_branch_ids()));

-- INSERT: an authenticated operator at the owning branch may insert an
-- extraction row directly (the route also uses the service role for background
-- OCR, which bypasses RLS). The branch_id must match a branch the user owns.
create policy extraction_results_insert
  on public.extraction_results for insert
  to authenticated
  with check (branch_id = any(public.get_my_branch_ids()));

-- No UPDATE/DELETE policies: extraction rows are immutable history (R2 hint is
-- retained for re-parsing). Default deny. Service role can still prune history.

-- ============================================================================
-- Defensive: no anonymous access to OCR-scoped tables.
-- ============================================================================
revoke all on public.extraction_results from anon;