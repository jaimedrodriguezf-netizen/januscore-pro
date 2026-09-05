import type {
  InvoiceItem,
  TenantBillingConfig,
  ElectronicInvoicePayload,
  ElectronicInvoiceResult,
  TaxIdLookupResult,
} from './types';

export const CIPHERBYTE_DEFAULT_BASE_URL = 'https://gateway.cipherbyte.ec/api/v1';

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  defaultIvaRate = 0.15
): { subtotal: number; ivaAmount: number; totalAmount: number } {
  let subtotal = 0;
  let ivaAmount = 0;

  for (const item of items) {
    const itemSubtotal = (item.quantity || 1) * (item.unit_price || 0) - (item.discount || 0);
    const rate = item.iva_rate !== undefined ? item.iva_rate : defaultIvaRate;
    subtotal += itemSubtotal;
    ivaAmount += itemSubtotal * rate;
  }

  // Round to 2 decimals
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const roundedIva = Math.round(ivaAmount * 100) / 100;
  const roundedTotal = Math.round((roundedSubtotal + roundedIva) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    ivaAmount: roundedIva,
    totalAmount: roundedTotal,
  };
}

export function formatInvoiceNumber(
  establishment: string,
  emissionPoint: string,
  sequenceNumber: number
): string {
  const est = establishment.trim().padStart(3, '0').slice(-3);
  const pto = emissionPoint.trim().padStart(3, '0').slice(-3);
  const seq = String(sequenceNumber).padStart(9, '0').slice(-9);
  return `${est}-${pto}-${seq}`;
}

export async function lookupTaxId(
  taxId: string,
  apiKey?: string
): Promise<TaxIdLookupResult | null> {
  const cleaned = taxId.trim().replace(/\D/g, '');
  if (cleaned.length !== 10 && cleaned.length !== 13) {
    return null;
  }

  const key = apiKey || process.env.CIPHERBYTE_API_KEY;
  if (!key) {
    // If no key configured, return null gracefully
    return null;
  }

  const baseUrl = process.env.CIPHERBYTE_BASE_URL || CIPHERBYTE_DEFAULT_BASE_URL;
  const endpoint = cleaned.length === 13 ? `/sri/ruc/${cleaned}` : `/sri/cedula/${cleaned}`;

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'X-Api-Key': key,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return {
      tax_id: cleaned,
      type: cleaned.length === 13 ? 'ruc' : 'cedula',
      name: data.razon_social || data.nombre_completo || data.nombre || '',
      commercial_name: data.nombre_fantasia_comercial || data.nombre_comercial,
      address: data.direccion_completa || data.direccion,
      activity: data.actividad_economica_principal,
      status: data.estado_contribuyente === 'ACTIVO' ? 'active' : 'passive',
      obligado_contabilidad: data.obligado_llevar_contabilidad === 'SI',
    };
  } catch {
    return null;
  }
}

export async function emitElectronicInvoice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  payload: ElectronicInvoicePayload
): Promise<ElectronicInvoiceResult> {
  // 1. Fetch tenant billing configuration
  const { data: config, error: configError } = await supabase
    .from('tenant_billing_configs')
    .select('*')
    .eq('tenant_id', payload.tenant_id)
    .maybeSingle();

  if (configError || !config) {
    return {
      success: false,
      error: 'La organización no tiene configurado el módulo de facturación electrónica SRI.',
    };
  }

  const billingConfig = config as TenantBillingConfig;

  if (!billingConfig.is_active) {
    return {
      success: false,
      error: 'El módulo de facturación electrónica de esta organización se encuentra inactivo.',
    };
  }

  const apiKey = billingConfig.cipherbyte_api_key || process.env.CIPHERBYTE_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'No se ha configurado la API Key de CipherByte para emitir comprobantes.',
    };
  }

  // 2. Count existing invoices for sequence
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', payload.tenant_id);

  const nextSequence = (count || 0) + 1;
  const invoiceNumber = formatInvoiceNumber(
    billingConfig.establishment_code || '001',
    billingConfig.emission_point_code || '001',
    nextSequence
  );

  const totals = calculateInvoiceTotals(payload.items);

  // 3. Mock/Remote call to CipherByte
  const baseUrl = process.env.CIPHERBYTE_BASE_URL || CIPHERBYTE_DEFAULT_BASE_URL;

  try {
    let sriResult: {
      access_key?: string;
      authorization_number?: string;
      authorization_date?: string;
      pdf_url?: string;
      xml_url?: string;
      status: 'authorized' | 'rejected' | 'pending';
      raw?: Record<string, unknown>;
    };

    const response = await fetch(`${baseUrl}/comprobantes/factura`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        ambiente: billingConfig.environment === 'production' ? 'PRODUCCION' : 'PRUEBAS',
        emisor: {
          ruc: billingConfig.ruc,
          razonSocial: billingConfig.legal_name,
          nombreComercial: billingConfig.tradename || billingConfig.legal_name,
          dirMatriz: billingConfig.address || 'Ecuador',
          establecimiento: billingConfig.establishment_code || '001',
          puntoEmision: billingConfig.emission_point_code || '001',
          obligadoContabilidad: billingConfig.forced_accounting ? 'SI' : 'NO',
        },
        comprobante: {
          numero: invoiceNumber,
          fechaEmision: new Date().toISOString().split('T')[0],
          cliente: {
            identificacion: payload.customer.tax_id,
            tipoIdentificacion: payload.customer.tax_id.length === 13 ? '04' : '05',
            razonSocial: payload.customer.name,
            email: payload.customer.email,
            telefono: payload.customer.phone,
            direccion: payload.customer.address,
          },
          detalles: payload.items.map((item) => ({
            codigoPrincipal: item.code || 'SERV-01',
            descripcion: item.description,
            cantidad: item.quantity,
            precioUnitario: item.unit_price,
            descuento: item.discount || 0,
            precioTotalSinImpuesto: item.total,
          })),
          totales: {
            subtotal: totals.subtotal,
            iva: totals.ivaAmount,
            total: totals.totalAmount,
          },
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      sriResult = {
        status: 'authorized',
        access_key: data.claveAcceso || data.clave_acceso,
        authorization_number: data.numeroAutorizacion || data.numero_autorizacion,
        authorization_date: data.fechaAutorizacion || new Date().toISOString(),
        pdf_url: data.rideUrl || data.pdf_url,
        xml_url: data.xmlUrl || data.xml_url,
        raw: data,
      };
    } else {
      // Fallback for test environment simulation if mock / offline
      const errText = await response.text();
      // If unauthorized or error, record attempt
      sriResult = {
        status: 'rejected',
        raw: { error: errText },
      };
    }

    // 4. Save into invoices table
    const { data: inserted, error: insertError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: payload.tenant_id,
        branch_id: payload.branch_id || null,
        reference_id: payload.reference_id || null,
        reference_type: payload.reference_type || 'general',
        invoice_number: invoiceNumber,
        access_key: sriResult.access_key || null,
        authorization_number: sriResult.authorization_number || null,
        authorization_date: sriResult.authorization_date || null,
        customer_tax_id: payload.customer.tax_id,
        customer_name: payload.customer.name,
        customer_email: payload.customer.email || null,
        customer_phone: payload.customer.phone || null,
        customer_address: payload.customer.address || null,
        subtotal: totals.subtotal,
        iva_amount: totals.ivaAmount,
        total_amount: totals.totalAmount,
        status: sriResult.status,
        items: payload.items,
        sri_response: sriResult.raw || null,
        pdf_url: sriResult.pdf_url || null,
        xml_url: sriResult.xml_url || null,
      })
      .select('id')
      .single();

    if (insertError) {
      return {
        success: false,
        error: `Error al registrar factura: ${insertError.message}`,
      };
    }

    return {
      success: sriResult.status === 'authorized',
      invoice_id: inserted?.id,
      invoice_number: invoiceNumber,
      access_key: sriResult.access_key,
      authorization_number: sriResult.authorization_number,
      authorization_date: sriResult.authorization_date,
      pdf_url: sriResult.pdf_url,
      xml_url: sriResult.xml_url,
      raw_response: sriResult.raw,
      error: sriResult.status === 'rejected' ? 'El SRI no autorizó el comprobante.' : undefined,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error de comunicación con CipherByte';
    return {
      success: false,
      error: errorMsg,
    };
  }
}
