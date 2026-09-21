-- 00020_invoice_sequences.sql
-- Atomic consecutive invoice numbering per tenant, establishment, and emission point.
-- Solves race conditions in SRI electronic invoicing by leveraging tenant_sequences.

-- 1. Helper function to atomically fetch and increment next invoice number
create or replace function public.get_next_invoice_sequence(
  p_tenant_id uuid,
  p_establishment text default '001',
  p_emission_point text default '001'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_est text;
  v_pto text;
  v_seq_type text;
  v_next_val bigint;
  v_prefix text;
begin
  -- Standardize establishment and emission point to 3 zero-padded digits
  v_est := lpad(right(trim(coalesce(p_establishment, '001')), 3), 3, '0');
  v_pto := lpad(right(trim(coalesce(p_emission_point, '001')), 3), 3, '0');
  v_seq_type := 'invoice:' || v_est || '-' || v_pto;
  v_prefix := v_est || '-' || v_pto || '-';

  -- Seed from existing invoices count if not yet recorded
  insert into public.tenant_sequences (tenant_id, sequence_type, current_val, prefix, padding)
  select 
    p_tenant_id, 
    v_seq_type, 
    coalesce(count(*), 0) + 1, 
    v_prefix, 
    9
  from public.invoices
  where tenant_id = p_tenant_id
    and invoice_number like (v_prefix || '%')
  on conflict (tenant_id, sequence_type)
  do update set 
    current_val = tenant_sequences.current_val + 1,
    updated_at = now()
  returning current_val into v_next_val;

  return v_prefix || lpad(v_next_val::text, 9, '0');
end;
$$;

grant execute on function public.get_next_invoice_sequence(uuid, text, text) to authenticated, service_role;
