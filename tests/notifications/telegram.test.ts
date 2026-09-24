import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTelegramSupportAlert } from '@/lib/notifications/telegram';

describe('Telegram Support Notifications', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('gracefully returns without failing when credentials are not configured', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const result = await sendTelegramSupportAlert({
      ticketId: 'test-uuid-1234',
      userEmail: 'user@example.com',
      category: 'bug',
      priority: 'high',
      subject: 'Problema con la orden de trabajo',
      message: 'No se puede imprimir el recibo',
    });

    expect(result.sent).toBe(false);
    expect(result.reason).toBe('missing_credentials');
  });

  it('sends text notification via fetch when credentials are provided', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:FAKE_TOKEN';
    process.env.TELEGRAM_CHAT_ID = '-100987654321';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const result = await sendTelegramSupportAlert({
      ticketId: 'ticket-abc',
      userEmail: 'mechanic@taller.ec',
      userRole: 'operator',
      tenantName: 'Taller Express',
      category: 'bug',
      priority: 'urgent',
      subject: 'Error 500 al guardar cliente',
      message: 'Al ingresar cédula da error <script>alert(1)</script>',
      pageUrl: 'http://localhost:3000/workshop',
      appVersion: '0.1.46',
      userAgent: 'Mozilla/5.0 Chrome/120',
    });

    expect(result.sent).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const callArgs = fetchSpy.mock.calls[0];
    expect(callArgs[0]).toBe('https://api.telegram.org/bot123456:FAKE_TOKEN/sendMessage');

    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.chat_id).toBe('-100987654321');
    expect(body.parse_mode).toBe('HTML');
    // Verify HTML escaping
    expect(body.text).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(body.text).toContain('Error 500 al guardar cliente');
    expect(body.text).toContain('Taller Express');
  });
});
