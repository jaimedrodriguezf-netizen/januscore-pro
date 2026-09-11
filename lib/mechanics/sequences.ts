import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Format a sequential number into a zero-padded work order identifier (e.g. 1 -> "OT-0001").
 */
export function formatWorkOrderNumber(
  seq: number,
  prefix: string = 'OT-',
  padding: number = 4
): string {
  const safeSeq = Math.max(1, Math.floor(seq));
  const numStr = safeSeq.toString();
  const padded = numStr.length >= padding ? numStr : numStr.padStart(padding, '0');
  return `${prefix}${padded}`;
}

/**
 * Parse an order number into its prefix and integer sequence number.
 * Returns null if the string cannot be parsed as a sequential order identifier.
 */
export function parseWorkOrderNumber(
  orderNumber: string
): { prefix: string; seq: number } | null {
  if (!orderNumber) return null;
  const match = orderNumber.trim().match(/^([A-Za-z_-]+)(\d+)$/);
  if (!match) return null;
  const seq = parseInt(match[2], 10);
  if (isNaN(seq) || seq <= 0) return null;
  return {
    prefix: match[1],
    seq,
  };
}

/**
 * Peek the next upcoming work order number for a tenant without incrementing the sequence.
 * Uses the database RPC function `peek_next_work_order_number`, or falls back to counting
 * existing maintenance records if the RPC is unavailable.
 */
export async function peekNextWorkOrderNumber(
  supabase: SupabaseClient,
  tenantId: string
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('peek_next_work_order_number', {
      p_tenant_id: tenantId,
    });
    if (!error && data && typeof data === 'string') {
      return data;
    }
  } catch {}

  // Fallback: count records
  try {
    const { count } = await supabase
      .from('maintenance_records')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    return formatWorkOrderNumber((count || 0) + 1);
  } catch {
    return 'OT-0001';
  }
}

/**
 * Atomically fetch and increment the next work order number for a tenant.
 * Uses the database RPC function `get_next_work_order_number`, or falls back to
 * incrementing from current maintenance records count if the RPC is unavailable.
 */
export async function getNextWorkOrderNumber(
  supabase: SupabaseClient,
  tenantId: string
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('get_next_work_order_number', {
      p_tenant_id: tenantId,
    });
    if (!error && data && typeof data === 'string') {
      return data;
    }
  } catch {}

  // Fallback: count records + 1
  try {
    const { count } = await supabase
      .from('maintenance_records')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    return formatWorkOrderNumber((count || 0) + 1);
  } catch {
    return 'OT-0001';
  }
}
