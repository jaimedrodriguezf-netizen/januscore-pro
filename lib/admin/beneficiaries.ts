import type { SupabaseClient } from '@supabase/supabase-js';

export interface BeneficiaryConfig {
  id: string;
  tenant_id: string;
  bank: string;
  account_number: string;
  account_holder: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AddBeneficiaryParams {
  tenantId: string;
  bank: string;
  accountNumber: string;
  accountHolder: string;
}

export interface UpdateBeneficiaryParams {
  bank?: string;
  accountNumber?: string;
  accountHolder?: string;
  isActive?: boolean;
}

/**
 * List beneficiary accounts for a tenant (R15), ordered by creation date descending.
 */
export async function listBeneficiaries(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<BeneficiaryConfig[]> {
  const { data, error } = await supabase
    .from('beneficiary_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list beneficiary accounts: ${error.message}`);
  }

  return (data ?? []) as BeneficiaryConfig[];
}

/**
 * Returns active beneficiary account numbers for a tenant (R5 / R15).
 * Used by review pipeline and matching logic.
 */
export async function getActiveBeneficiaryAccounts(
  supabase: SupabaseClient,
  tenantId: string,
  bank?: string,
): Promise<string[]> {
  let query = supabase
    .from('beneficiary_configs')
    .select('account_number')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (bank) {
    query = query.eq('bank', bank);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch active beneficiary accounts: ${error.message}`);
  }

  return (data ?? []).map((row: { account_number: string }) => row.account_number);
}

/**
 * Add a new beneficiary account for a tenant (R15).
 */
export async function addBeneficiary(
  supabase: SupabaseClient,
  params: AddBeneficiaryParams,
): Promise<BeneficiaryConfig> {
  const bank = params.bank?.trim();
  const accountNumber = params.accountNumber?.trim();
  const accountHolder = params.accountHolder?.trim();

  if (!params.tenantId) {
    throw new Error('Tenant ID is required');
  }
  if (!bank) {
    throw new Error('Bank name is required');
  }
  if (!accountNumber) {
    throw new Error('Account number is required');
  }
  if (!accountHolder) {
    throw new Error('Account holder name is required');
  }

  const { data, error } = await supabase
    .from('beneficiary_configs')
    .insert({
      tenant_id: params.tenantId,
      bank,
      account_number: accountNumber,
      account_holder: accountHolder,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to add beneficiary account: ${error?.message}`);
  }

  return data as BeneficiaryConfig;
}

/**
 * Update an existing beneficiary account (R15).
 */
export async function updateBeneficiary(
  supabase: SupabaseClient,
  id: string,
  updates: UpdateBeneficiaryParams,
): Promise<BeneficiaryConfig> {
  const patch: Record<string, unknown> = {};
  if (updates.bank !== undefined) patch.bank = updates.bank.trim();
  if (updates.accountNumber !== undefined) patch.account_number = updates.accountNumber.trim();
  if (updates.accountHolder !== undefined) patch.account_holder = updates.accountHolder.trim();
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('beneficiary_configs')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update beneficiary account: ${error?.message}`);
  }

  return data as BeneficiaryConfig;
}

/**
 * Toggle active status of a beneficiary account (R15).
 */
export async function toggleBeneficiaryStatus(
  supabase: SupabaseClient,
  id: string,
  isActive: boolean,
): Promise<BeneficiaryConfig> {
  const { data, error } = await supabase
    .from('beneficiary_configs')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to toggle beneficiary account status: ${error?.message}`);
  }

  return data as BeneficiaryConfig;
}

/**
 * Delete a beneficiary account (R15).
 */
export async function deleteBeneficiary(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('beneficiary_configs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete beneficiary account: ${error.message}`);
  }
}
