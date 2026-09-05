import { describe, it, expect, vi } from 'vitest';
import { calculateInvoiceTotals, formatInvoiceNumber } from '@/lib/billing/cipherbyte';
import type { InvoiceItem } from '@/lib/billing/types';

describe('CipherByte Electronic Invoicing Service', () => {
  it('correctly calculates subtotal, 15% IVA and grand total for items', () => {
    const items: InvoiceItem[] = [
      {
        description: 'Cambio de Aceite Sintético 5W-30',
        quantity: 1,
        unit_price: 40.0,
        total: 40.0,
        iva_rate: 0.15,
      },
      {
        description: 'Filtro de Aceite OEM',
        quantity: 1,
        unit_price: 10.0,
        total: 10.0,
        iva_rate: 0.15,
      },
    ];

    const totals = calculateInvoiceTotals(items);

    expect(totals.subtotal).toBe(50.0);
    expect(totals.ivaAmount).toBe(7.5);
    expect(totals.totalAmount).toBe(57.5);
  });

  it('formats invoice number according to SRI 3-3-9 digits standard', () => {
    const formatted = formatInvoiceNumber('1', '1', 42);
    expect(formatted).toBe('001-001-000000042');

    const formatted2 = formatInvoiceNumber('002', '005', 1058);
    expect(formatted2).toBe('002-005-000001058');
  });
});
