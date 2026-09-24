-- 00021_support_tickets.sql
-- Support ticketing system with image attachments and metadata.
-- Storage bucket: support-attachments (private, RLS-protected).

-- ============================================================================
-- Storage: Bucket for support attachments (screenshots/photos)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Extract the user_id (1st path segment) from storage object path: <user_id>/<file_uuid>.<ext>
create or replace function public.support_attachment_user_id(p_path text)
returns uuid
language sql
security definer
set search_path = public
immutable
as $$
  select nullif((string_to_array(p_path, '/'))[1], '')::uuid
$$;

create policy support_attachments_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'support-attachments'
    and (
      public.am_i_platform_admin()
      or public.support_attachment_user_id(name) = auth.uid()
    )
  );

create policy support_attachments_select
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'support-attachments'
    and (
      public.am_i_platform_admin()
      or public.support_attachment_user_id(name) = auth.uid()
    )
  );

-- ============================================================================
-- Table: support_tickets
-- ============================================================================
create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  tenant_id       uuid references public.tenants(id) on delete set null,
  category        text not null default 'bug' check (category in ('bug', 'question', 'feature', 'other')),
  priority        text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  subject         text not null,
  message         text not null,
  attachment_path text,
  status          text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  metadata        jsonb not null default '{}'::jsonb,
  admin_notes     text,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

create index if not exists idx_support_tickets_user_id on public.support_tickets(user_id);
create index if not exists idx_support_tickets_tenant_id on public.support_tickets(tenant_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_created_at on public.support_tickets(created_at desc);

-- ============================================================================
-- RLS policies for support_tickets
-- ============================================================================
alter table public.support_tickets enable row level security;

-- Authenticated users can create tickets assigned to themselves
create policy support_tickets_insert
  on public.support_tickets for insert
  to authenticated
  with check (
    user_id = auth.uid()
  );

-- Users see their own tickets; Platform superadmins see all tickets
create policy support_tickets_select
  on public.support_tickets for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.am_i_platform_admin()
  );

-- Only platform admins can update status, priority, or admin notes
create policy support_tickets_update
  on public.support_tickets for update
  to authenticated
  using (
    public.am_i_platform_admin()
  )
  with check (
    public.am_i_platform_admin()
  );

-- Only platform admins can delete tickets
create policy support_tickets_delete
  on public.support_tickets for delete
  to authenticated
  using (
    public.am_i_platform_admin()
  );

revoke all on public.support_tickets from anon;

-- ============================================================================
-- Real-time Telegram notification trigger via Supabase Edge Function & pg_net
-- ============================================================================
create extension if not exists "pg_net" with schema extensions;

create or replace function public.on_support_ticket_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'support_tickets',
    'schema', 'public',
    'record', row_to_json(new)::jsonb,
    'old_record', null
  );

  perform net.http_post(
    url := 'https://wdjpxveqdqmwhcjmsigs.supabase.co/functions/v1/telegram-support',
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  return new;
end;
$$;

drop trigger if exists trigger_support_ticket_telegram on public.support_tickets;
create trigger trigger_support_ticket_telegram
  after insert on public.support_tickets
  for each row execute function public.on_support_ticket_created();

