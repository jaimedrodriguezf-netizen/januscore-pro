/**
 * Telegram notification service for support tickets.
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.
 */

export interface TelegramSupportAlertInput {
  ticketId: string;
  userEmail: string;
  userRole?: string;
  tenantName?: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  pageUrl?: string;
  appVersion?: string;
  userAgent?: string;
  imageBuffer?: Buffer | Uint8Array;
  imageMimeType?: string;
  imageFileName?: string;
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

export async function sendTelegramSupportAlert(
  input: TelegramSupportAlertInput
): Promise<{ sent: boolean; reason?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados. Omitiendo notificación.');
    return { sent: false, reason: 'missing_credentials' };
  }

  const categoryLabel = CATEGORY_MAP[input.category] || input.category;
  const priorityLabel = PRIORITY_MAP[input.priority] || input.priority;

  const summaryLines = [
    `🎫 <b>Nuevo Ticket de Soporte</b>`,
    `<b>ID:</b> <code>${escapeHtml(input.ticketId)}</code>`,
    `<b>Usuario:</b> ${escapeHtml(input.userEmail)} ${input.userRole ? `(<i>${escapeHtml(input.userRole)}</i>)` : ''}`,
    input.tenantName ? `<b>Organización:</b> ${escapeHtml(input.tenantName)}` : null,
    `<b>Categoría:</b> ${categoryLabel} | <b>Prioridad:</b> ${priorityLabel}`,
    `<b>Asunto:</b> <b>${escapeHtml(input.subject)}</b>`,
    ``,
    `<b>Mensaje:</b>`,
    `${escapeHtml(input.message)}`,
    ``,
    `<b>Contexto del Sistema:</b>`,
    input.pageUrl ? `• <b>Ruta:</b> <code>${escapeHtml(input.pageUrl)}</code>` : null,
    input.appVersion ? `• <b>Versión:</b> <code>v${escapeHtml(input.appVersion)}</code>` : null,
    input.userAgent ? `• <b>Entorno:</b> <code>${escapeHtml(input.userAgent)}</code>` : null,
  ].filter(Boolean).join('\n');

  try {
    if (input.imageBuffer && input.imageBuffer.length > 0) {
      // Telegram sendPhoto caption has a 1024 character limit.
      const photoFormData = new FormData();
      photoFormData.append('chat_id', chatId);

      // Convert Uint8Array/Buffer to Blob for standard fetch FormData
      const blob = new Blob([input.imageBuffer as unknown as BlobPart], {
        type: input.imageMimeType || 'image/jpeg',
      });
      photoFormData.append('photo', blob, input.imageFileName || 'screenshot.jpg');
      photoFormData.append('parse_mode', 'HTML');

      if (summaryLines.length <= 1024) {
        photoFormData.append('caption', summaryLines);
        const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          body: photoFormData,
        });

        if (res.ok) {
          return { sent: true };
        }
        console.error('[Telegram] Error enviando sendPhoto:', await res.text());
      } else {
        // Send image with a brief caption, then the full text in sendMessage
        const shortCaption = `🎫 <b>Nuevo Ticket de Soporte</b>\n<b>ID:</b> <code>${escapeHtml(input.ticketId)}</code>\n<b>Asunto:</b> ${escapeHtml(input.subject)}`;
        photoFormData.append('caption', shortCaption);
        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          body: photoFormData,
        });
      }
    }

    // Text message via sendMessage (up to 4096 chars)
    const textRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: summaryLines.slice(0, 4000),
        parse_mode: 'HTML',
      }),
    });

    if (!textRes.ok) {
      const errText = await textRes.text();
      console.error('[Telegram] Error enviando sendMessage:', errText);
      return { sent: false, reason: errText };
    }

    return { sent: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Telegram] Excepción al enviar alerta:', errorMsg);
    return { sent: false, reason: errorMsg };
  }
}
