import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * R8: Append-only immutable audit log helper.
 */
export interface AuditEntry {
  tenantId: string;
  branchId?: string | null;
  actorId?: string | null;
  targetType: string;
  targetId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(
  supabase: SupabaseClient,
  entry: AuditEntry,
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    tenant_id: entry.tenantId,
    branch_id: entry.branchId ?? null,
    actor_id: entry.actorId ?? null,
    target_type: entry.targetType,
    target_id: entry.targetId,
    action: entry.action,
    metadata: entry.metadata ?? {},
  });

  if (error) {
    throw new Error(`Failed to write audit log: ${error.message}`);
  }
}
