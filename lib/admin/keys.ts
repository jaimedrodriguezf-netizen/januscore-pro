import type { SupabaseClient } from '@supabase/supabase-js';

export interface BankPublicKey {
  id: string;
  tenant_id: string;
  bank: string;
  public_key: string;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  deactivated_at?: string | null;
}

export interface AddBankPublicKeyParams {
  tenantId: string;
  bank: string;
  publicKeyHex: string;
  createdBy?: string;
}

/**
 * List bank public keys for a tenant, ordered by creation date descending.
 */
export async function listBankPublicKeys(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<BankPublicKey[]> {
  const { data, error } = await supabase
    .from('bank_public_keys')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list bank public keys: ${error.message}`);
  }

  return (data ?? []) as BankPublicKey[];
}

/**
 * Get the single currently active public key for a tenant and bank.
 */
export async function getActiveBankPublicKey(
  supabase: SupabaseClient,
  tenantId: string,
  bank: string,
): Promise<BankPublicKey | null> {
  const { data, error } = await supabase
    .from('bank_public_keys')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('bank', bank)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get active bank public key: ${error.message}`);
  }

  return (data as BankPublicKey) ?? null;
}

/**
 * Add a new bank public key (R14).
 * Validates 32-byte hex (64 hex characters) format.
 */
export async function addBankPublicKey(
  supabase: SupabaseClient,
  params: AddBankPublicKeyParams,
): Promise<BankPublicKey> {
  const cleanHex = params.publicKeyHex.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(cleanHex)) {
    throw new Error('Public key must be a valid 32-byte (64 character) hex string');
  }

  if (!params.bank || !params.bank.trim()) {
    throw new Error('Bank name is required');
  }

  if (!params.tenantId) {
    throw new Error('Tenant ID is required');
  }

  const { data, error } = await supabase
    .from('bank_public_keys')
    .insert({
      tenant_id: params.tenantId,
      bank: params.bank.trim(),
      public_key: cleanHex,
      is_active: true,
      created_by: params.createdBy ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to add bank public key: ${error?.message}`);
  }

  return data as BankPublicKey;
}

/**
 * Deactivates a bank public key (R14).
 * Sets is_active = false and deactivated_at = now.
 */
export async function deactivateBankPublicKey(
  supabase: SupabaseClient,
  keyId: string,
  tenantId?: string,
): Promise<BankPublicKey> {
  let query = supabase
    .from('bank_public_keys')
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
    })
    .eq('id', keyId);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query.select().single();

  if (error || !data) {
    throw new Error(`Failed to deactivate bank public key: ${error?.message}`);
  }

  return data as BankPublicKey;
}

/**
 * Toggle the active status of a bank public key (R14).
 */
export async function toggleBankPublicKeyStatus(
  supabase: SupabaseClient,
  keyId: string,
  isActive: boolean,
  tenantId?: string,
): Promise<BankPublicKey> {
  const patch: Record<string, unknown> = {
    is_active: isActive,
    deactivated_at: isActive ? null : new Date().toISOString(),
  };

  let query = supabase.from('bank_public_keys').update(patch).eq('id', keyId);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query.select().single();

  if (error || !data) {
    throw new Error(`Failed to toggle bank public key status: ${error?.message}`);
  }

  return data as BankPublicKey;
}
