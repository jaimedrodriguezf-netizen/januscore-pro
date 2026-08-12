-- 00002_receipts.sql
-- PR2 (Phase 2): receipts, receipt_files, storage bucket receipts-original + RLS.
-- Implements: R1 (manual ingestion, immutable originals stored byte-for-byte).
-- Self-contained for PR2: every policy references only tables created here or
-- in 00001_tenants.sql (branches, get_my_branch_ids helper). audit_logs is not
-- created here; it lands in 00005_audit.sql (Phase 5), so the register flow in
-- PR2 records the receipt row only and is audit-ready (actor captured now).

-- ============================================================================
-- receipts (logical record of one uploaded receipt)
-- ============================================================================
create table if not exists public.receipts (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  branch_id        uuid not null references public.branches(id) on delete cascade,
  uploaded_by      uuid not null references public.profiles(id) on delete set null,
  status           text not null default 'pending'
                   check (status in ('pending','needs_review','approved','rejected')),
  storage_path     text not null,
  original_filename text not null,
  mime_type        text not null,
  file_size        bigint not null check (file_size >= 0),
  file_sha256      text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger receipts_set_updated_at
  before update on public.receipts
  for each row execute function public.set_updated_at();

create index if not exists receipts_tenant_branch_idx
  on public.receipts (tenant_id, branch_id, created_at desc);
create index if not exists receipts_status_idx on public.receipts (status);
create index if not exists receipts_uploaded_by_idx on public.receipts (uploaded_by);

-- ============================================================================
-- receipt_files (physical file records; the original is immutable, is_original)
-- Multiple rows per receipt are allowed so later phases can store derived files
-- (OCR text, thumbnails) without altering the original byte stream.
-- ============================================================================
create table if not exists public.receipt_files (
  id                uuid primary key default gen_random_uuid(),
  receipt_id        uuid not null references public.receipts(id) on delete cascade,
  storage_path      text not null,
  original_filename text not null,
  mime_type         text not null,
  file_size         bigint not null check (file_size >= 0),
  file_sha256       text not null,
  is_original       boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists receipt_files_receipt_idx on public.receipt_files (receipt_id);
create unique index if not exists receipt_files_one_original
  on public.receipt_files (receipt_id) where is_original;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.receipts       enable row level security;
alter table public.receipt_files  enable row level security;

-- SELECT: an operator sees receipts whose branch they can access (R16: branch
-- membership implies tenant membership, so this also enforces tenant isolation).
create policy receipts_select
  on public.receipts for select
  to authenticated
  using (branch_id = any(public.get_my_branch_ids()));

-- INSERT: an operator may register a receipt only at a branch they belong to,
-- and the row's tenant_id must match the branch's tenant (prevents a user who
-- belongs to two tenants from mislabeling a receipt with the wrong tenant).
create policy receipts_insert
  on public.receipts for insert
  to authenticated
  with check (
    branch_id = any(public.get_my_branch_ids())
    and exists (
      select 1 from public.branches b
      where b.id = receipts.branch_id and b.tenant_id = receipts.tenant_id
    )
  );

-- No UPDATE/DELETE policies on receipts in PR2: originals are immutable and
-- review transitions (Phase 5) will add scoped UPDATE policies. Default deny.

-- receipt_files inherits visibility from its receipt.
create policy receipt_files_select
  on public.receipt_files for select
  to authenticated
  using (
    exists (
      select 1 from public.receipts r
      where r.id = receipt_files.receipt_id
        and r.branch_id = any(public.get_my_branch_ids())
    )
  );

create policy receipt_files_insert
  on public.receipt_files for insert
  to authenticated
  with check (
    exists (
      select 1 from public.receipts r
      where r.id = receipt_files.receipt_id
        and r.branch_id = any(public.get_my_branch_ids())
    )
  );

-- ============================================================================
-- Storage: immutable bucket for original receipts.
-- Path convention: <tenant_id>/<branch_id>/<YYYY>/<MM>/<uuid>
-- Immutability is enforced structurally: every object key ends in a fresh
-- uuid, so a re-upload never overwrites an existing object (upsert=false in the
-- app layer). Storage SELECT/INSERT policies mirror table RLS via the branch.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('receipts-original', 'receipts-original', false)
on conflict (id) do nothing;

-- Parse the branch_id (2nd path segment) from a storage object name.
create or replace function public.receipts_original_branch_id(p_path text)
returns uuid
language sql
security definer
set search_path = public
immutable
as $$
  select nullif((string_to_array(p_path, '/'))[2], '')::uuid
$$;

create policy receipts_original_select
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts-original'
    and public.receipts_original_branch_id(name) = any(public.get_my_branch_ids())
  );

create policy receipts_original_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts-original'
    and public.receipts_original_branch_id(name) = any(public.get_my_branch_ids())
  );

-- Service role (background OCR/QR jobs in later phases) bypasses storage RLS.

-- ============================================================================
-- Defensive: no anonymous access to receipts-scoped tables or storage bucket.
-- ============================================================================
revoke all on public.receipts      from anon;
revoke all on public.receipt_files from anon;