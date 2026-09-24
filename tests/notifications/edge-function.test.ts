import { describe, it, expect } from 'vitest';

describe('Supabase Telegram Edge Function Payload & Logic', () => {
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

  it('correctly maps category and priority labels', () => {
    expect(CATEGORY_MAP['bug']).toBe('🐛 Error / Bug');
    expect(CATEGORY_MAP['question']).toBe('❓ Consulta / Duda');
    expect(PRIORITY_MAP['urgent']).toBe('🔴 Urgente');
    expect(PRIORITY_MAP['normal']).toBe('🔵 Normal');
  });

  it('escapes user content to avoid breaking Telegram HTML parse mode', () => {
    const maliciousInput = '<script>alert("hack")</script> & <b>test</b>';
    const escaped = escapeHtml(maliciousInput);

    expect(escaped).toBe('&lt;script&gt;alert("hack")&lt;/script&gt; &amp; &lt;b&gt;test&lt;/b&gt;');
  });

  it('builds full notification summary with all metadata', () => {
    const record = {
      id: 'ticket-12345678',
      category: 'bug',
      priority: 'urgent',
      subject: 'Problema en facturación',
      message: 'No carga el botón de emitir factura.',
      metadata: {
        page_url: 'https://app.januscore.pro/billing',
        app_version: '0.1.46',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    };

    const userEmail = 'mecanico@autotaller.ec';
    const userRole = '👑 Superadmin';
    const tenantName = 'Taller Central';

    const summaryLines = [
      `🎫 <b>Nuevo Ticket de Soporte</b>`,
      `<b>ID:</b> <code>${escapeHtml(record.id)}</code>`,
      `<b>Usuario:</b> ${escapeHtml(userEmail)} (<i>${escapeHtml(userRole)}</i>)`,
      `<b>Organización:</b> ${escapeHtml(tenantName)}`,
      `<b>Categoría:</b> ${CATEGORY_MAP[record.category]} | <b>Prioridad:</b> ${PRIORITY_MAP[record.priority]}`,
      `<b>Asunto:</b> <b>${escapeHtml(record.subject)}</b>`,
      ``,
      `<b>Mensaje:</b>`,
      `${escapeHtml(record.message)}`,
      ``,
      `<b>Contexto del Sistema:</b>`,
      `• <b>Ruta:</b> <code>${escapeHtml(record.metadata.page_url)}</code>`,
      `• <b>Versión:</b> <code>v${escapeHtml(record.metadata.app_version)}</code>`,
      `• <b>Entorno:</b> <code>${escapeHtml(record.metadata.user_agent)}</code>`,
    ].join('\n');

    expect(summaryLines).toContain('ticket-12345678');
    expect(summaryLines).toContain('mecanico@autotaller.ec');
    expect(summaryLines).toContain('Taller Central');
    expect(summaryLines).toContain('https://app.januscore.pro/billing');
    expect(summaryLines).toContain('v0.1.46');
  });

  it('validates webhook event filtering', () => {
    const isProcessable = (type: string, table: string) => type === 'INSERT' && table === 'support_tickets';

    expect(isProcessable('INSERT', 'support_tickets')).toBe(true);
    expect(isProcessable('UPDATE', 'support_tickets')).toBe(false);
    expect(isProcessable('DELETE', 'support_tickets')).toBe(false);
    expect(isProcessable('INSERT', 'profiles')).toBe(false);
  });
});
