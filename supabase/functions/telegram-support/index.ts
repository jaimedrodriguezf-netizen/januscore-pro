// supabase/functions/telegram-support/index.ts
// Supabase Edge Function to deliver real-time Telegram alerts on new support tickets.
// Triggered via Database Webhook on INSERT into public.support_tickets.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    user_id: string;
    tenant_id?: string | null;
    category: string;
    priority: string;
    subject: string;
    message: string;
    attachment_path?: string | null;
    status: string;
    metadata?: Record<string, unknown>;
    created_at: string;
  };
  old_record: unknown;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const CATEGORY_MAP: Record<string, string> = {
  bug: '🐛 Error / Bug',
  question: '❓ Consulta / Duda',
  feature: '💡 Sugerencia / Mejora',
  other: '📌 Otro',
};

const PRIORITY_MAP: Record<string, string> = {
  low: '🟢 Baja',
  normal: '🔵 Normal',
  high: '🟠 Alta',
  urgent: '🔴 Urgente',
};

// @ts-ignore: Deno global is provided at runtime by Supabase Edge Runtime
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();

    // Only process INSERT events on support_tickets
    if (payload.type !== 'INSERT' || payload.table !== 'support_tickets') {
      return new Response(JSON.stringify({ message: 'Ignored non-INSERT event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { record } = payload;
    // @ts-ignore: Deno.env
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '8967790545:AAHSCZXlOxbwKE6QH2LlvUdgl9azCTNR4Rw';
    // @ts-ignore: Deno.env
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID') || '7804791527';

    if (!botToken || !chatId) {
      console.warn('[Telegram Edge] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados en secrets.');
      return new Response(JSON.stringify({ error: 'Telegram secrets missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 so Supabase webhook doesn't retry endlessly if unconfigured
      });
    }

    // Initialize Supabase admin client using internal environment variables
    // @ts-ignore: Deno.env
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    // @ts-ignore: Deno.env
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user email and role from profiles
    let userEmail = 'Usuario';
    let userRole = '';
    if (record.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, is_platform_admin')
        .eq('id', record.user_id)
        .maybeSingle();

      if (profile) {
        userEmail = profile.email || 'Usuario';
        if (profile.is_platform_admin) {
          userRole = '👑 Superadmin';
        }
      }
    }

    // Fetch tenant name if assigned
    let tenantName = '';
    if (record.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', record.tenant_id)
        .maybeSingle();

      if (tenant?.name) {
        tenantName = tenant.name;
      }
    }

    const categoryLabel = CATEGORY_MAP[record.category] || record.category;
    const priorityLabel = PRIORITY_MAP[record.priority] || record.priority;
    const meta = (record.metadata || {}) as Record<string, unknown>;

    const summaryLines = [
      `🎫 <b>Nuevo Ticket de Soporte</b>`,
      `<b>ID:</b> <code>${escapeHtml(record.id)}</code>`,
      `<b>Usuario:</b> ${escapeHtml(userEmail)} ${userRole ? `(<i>${escapeHtml(userRole)}</i>)` : ''}`,
      tenantName ? `<b>Organización:</b> ${escapeHtml(tenantName)}` : null,
      `<b>Categoría:</b> ${categoryLabel} | <b>Prioridad:</b> ${priorityLabel}`,
      `<b>Asunto:</b> <b>${escapeHtml(record.subject)}</b>`,
      ``,
      `<b>Mensaje:</b>`,
      `${escapeHtml(record.message)}`,
      ``,
      `<b>Contexto del Sistema:</b>`,
      meta.page_url ? `• <b>Ruta:</b> <code>${escapeHtml(String(meta.page_url))}</code>` : null,
      meta.app_version ? `• <b>Versión:</b> <code>v${escapeHtml(String(meta.app_version))}</code>` : null,
      meta.user_agent ? `• <b>Entorno:</b> <code>${escapeHtml(String(meta.user_agent))}</code>` : null,
    ].filter(Boolean).join('\n');

    // Download screenshot from Supabase Storage if an attachment exists
    if (record.attachment_path) {
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('support-attachments')
        .download(record.attachment_path);

      if (!downloadError && fileBlob) {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', fileBlob, 'screenshot.png');
        formData.append('parse_mode', 'HTML');

        if (summaryLines.length <= 1024) {
          formData.append('caption', summaryLines);
          const sendPhotoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: formData,
          });

          if (sendPhotoRes.ok) {
            return new Response(JSON.stringify({ success: true, method: 'sendPhoto' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          console.error('[Telegram Edge] sendPhoto falló, degradando a sendMessage:', await sendPhotoRes.text());
        } else {
          // Send photo with short caption, then full text via sendMessage
          formData.append(
            'caption',
            `🎫 <b>Nuevo Ticket de Soporte</b>\n<b>ID:</b> <code>${escapeHtml(record.id)}</code>\n<b>Asunto:</b> ${escapeHtml(record.subject)}`
          );
          await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: formData,
          });
        }
      }
    }

    // Fallback or text-only dispatch via sendMessage
    const sendMsgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: summaryLines.slice(0, 4000),
        parse_mode: 'HTML',
      }),
    });

    const result = await sendMsgRes.json();
    return new Response(JSON.stringify({ success: sendMsgRes.ok, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Telegram Edge Error]', errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
