export interface TenantBillingConfig {
  tenant_id: string;
  ruc: string;
  legal_name: string;
  tradename?: string | null;
  address?: string | null;
  establishment_code: string; // e.g. '001'
  emission_point_code: string; // e.g. '001'
  cipherbyte_api_key?: string | null;
  environment: 'test' | 'production';
  is_active: boolean;
  special_taxpayer_number?: string | null;
  forced_accounting: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItem {
  code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total: number;
  iva_rate?: number; // default 15% (Ecuador current standard)
}

export interface CustomerBillingInfo {
  tax_id: string; // RUC, Cédula, o Pasaporte
  tax_id_type?: 'ruc' | 'cedula' | 'passport' | 'final_consumer';
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ElectronicInvoicePayload {
  tenant_id: string;
  branch_id?: string;
  reference_id?: string;
  reference_type?: 'workshop' | 'b2b' | 'beauty' | 'general';
  customer: CustomerBillingInfo;
  items: InvoiceItem[];
  payment_method?: 'cash' | 'card' | 'transfer' | 'other';
  notes?: string;
}

export interface ElectronicInvoiceResult {
  success: boolean;
  invoice_id?: string;
  invoice_number?: string;
  access_key?: string;
  authorization_number?: string;
  authorization_date?: string;
  pdf_url?: string;
  xml_url?: string;
  error?: string;
  raw_response?: Record<string, unknown>;
}

export interface TaxIdLookupResult {
  tax_id: string;
  type: 'ruc' | 'cedula' | 'unknown';
  name: string;
  commercial_name?: string;
  address?: string;
  activity?: string;
  status?: 'active' | 'passive' | 'unknown';
  obligado_contabilidad?: boolean;
}
