'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserRoleInfo } from '@/lib/tenancy/role';
import { APP_VERSION } from '@/lib/version';
import { revalidatePath } from 'next/cache';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface CreateSupportTicketResult {
  ok: boolean;
  ticketId?: string;
  error?: string;
}

export async function createSupportTicket(
  formData: FormData
): Promise<CreateSupportTicketResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: 'Debes iniciar sesión para enviar un ticket de soporte.' };
    }

    const subject = (formData.get('subject') as string)?.trim();
    const message = (formData.get('message') as string)?.trim();
    const category = (formData.get('category') as string) || 'bug';
    const priority = (formData.get('priority') as string) || 'normal';
    const metadataRaw = formData.get('metadata') as string | null;
    const file = formData.get('file') as File | null;

    if (!subject) {
      return { ok: false, error: 'El asunto es obligatorio.' };
    }
    if (!message) {
      return { ok: false, error: 'El mensaje descriptivo es obligatorio.' };
    }

    let parsedMetadata: Record<string, unknown> = {};
    if (metadataRaw) {
      try {
        parsedMetadata = JSON.parse(metadataRaw);
      } catch {
        parsedMetadata = {};
      }
    }
    parsedMetadata.app_version = APP_VERSION;

    const roleInfo = await getUserRoleInfo(supabase);

    let attachmentPath: string | null = null;

    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return { ok: false, error: 'La imagen adjunta no puede superar los 10MB.' };
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { ok: false, error: 'Formato no soportado. Usá JPG, PNG, WEBP o GIF.' };
      }

      const ext = file.name.split('.').pop() || 'png';
      const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'png';
      const fileId = crypto.randomUUID();
      const storageKey = `${user.id}/${Date.now()}-${fileId}.${cleanExt}`;

      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('support-attachments')
        .upload(storageKey, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[Support] Error subiendo adjunto:', uploadError);
        return { ok: false, error: `Error al guardar la imagen: ${uploadError.message}` };
      }

      attachmentPath = storageKey;
    }

    // Save ticket in database.
    // Real-time Telegram notification is dispatched automatically by Supabase Edge Function
    // triggered on INSERT into public.support_tickets (zero CPU/network load on Hostinger).
    const { data: ticket, error: dbError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        tenant_id: roleInfo.tenantId || null,
        category,
        priority,
        subject,
        message,
        attachment_path: attachmentPath,
        metadata: parsedMetadata,
        status: 'open',
      })
      .select('id')
      .single();

    if (dbError || !ticket) {
      console.error('[Support] Error insertando ticket:', dbError);
      return { ok: false, error: 'No se pudo registrar el ticket en el sistema.' };
    }

    return { ok: true, ticketId: ticket.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Support] Error general en createSupportTicket:', message);
    return { ok: false, error: 'Ocurrió un error inesperado al procesar la solicitud.' };
  }
}

export async function updateSupportTicket(
  ticketId: string,
  updates: {
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    adminNotes?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const roleInfo = await getUserRoleInfo(supabase);

    if (!roleInfo.isPlatformAdmin) {
      return { ok: false, error: 'Acceso no autorizado. Se requiere rol de Superadmin.' };
    }

    const payload: Record<string, unknown> = {};
    if (updates.status) {
      payload.status = updates.status;
      if (updates.status === 'resolved' || updates.status === 'closed') {
        payload.resolved_at = new Date().toISOString();
      } else {
        payload.resolved_at = null;
      }
    }
    if (updates.priority) {
      payload.priority = updates.priority;
    }
    if (typeof updates.adminNotes === 'string') {
      payload.admin_notes = updates.adminNotes;
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(payload)
      .eq('id', ticketId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath('/support');
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export async function getTicketAttachmentSignedUrl(
  attachmentPath: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from('support-attachments')
      .createSignedUrl(attachmentPath, 3600); // 1 hour expiration

    if (error || !data?.signedUrl) {
      return { error: error?.message || 'No se pudo generar enlace firmado.' };
    }

    return { url: data.signedUrl };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
