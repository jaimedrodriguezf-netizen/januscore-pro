export interface ClientUpdateInput {
  name: string;
  identification?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ClientUpdateSanitized {
  name: string;
  identification: string | null;
  phone: string | null;
  email: string | null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: ClientUpdateSanitized;
}

export interface UpdateWorkshopClientParams {
  tenantId: string;
  originalIdentification?: string | null;
  originalName?: string | null;
  name: string;
  identification?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateWorkshopClientResult {
  success: boolean;
  updatedCount?: number;
  error?: string;
}

/**
 * Validates and sanitizes client data prior to database update.
 */
export function validateClientUpdate(input: ClientUpdateInput): ValidationResult {
  const name = (input.name || '').trim();
  if (!name) {
    return { valid: false, error: 'El nombre del cliente es requerido' };
  }

  const rawId = (input.identification || '').trim().replace(/\D/g, '');
  const identification = rawId || null;

  const rawPhone = (input.phone || '').trim().replace(/[^\d+]/g, '');
  const phone = rawPhone || null;

  const rawEmail = (input.email || '').trim().toLowerCase();
  const email = rawEmail || null;

  return {
    valid: true,
    data: {
      name,
      identification,
      phone,
      email,
    },
  };
}

/**
 * Updates client details across all vehicles associated with that client in the workshop.
 */
export async function updateWorkshopClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  params: UpdateWorkshopClientParams
): Promise<UpdateWorkshopClientResult> {
  const { tenantId, originalIdentification, originalName } = params;

  const validation = validateClientUpdate({
    name: params.name,
    identification: params.identification,
    phone: params.phone,
    email: params.email,
  });

  if (!validation.valid || !validation.data) {
    return { success: false, error: validation.error || 'Datos inválidos' };
  }

  const { name, identification, phone, email } = validation.data;

  let query = supabase
    .from('vehicles')
    .update(
      {
        owner_name: name,
        owner_identification: identification,
        owner_phone: phone,
        owner_email: email,
      },
      { count: 'exact' }
    )
    .eq('tenant_id', tenantId);

  if (originalIdentification) {
    query = query.eq('owner_identification', originalIdentification);
  } else if (originalName) {
    query = query.eq('owner_name', originalName);
  } else {
    return { success: false, error: 'Identificador o nombre original es requerido para actualizar' };
  }

  const { error, count } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, updatedCount: count ?? 0 };
}
