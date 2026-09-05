import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { lookupTaxId } from '@/lib/billing/cipherbyte';
import type { TenantBillingConfig } from '@/lib/billing/types';

export default async function TenantBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { id: tenantId } = await params;
  const queryParams = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Superadmin gate
  const { data: isPlatformAdmin } = await supabase.rpc('am_i_platform_admin');
  if (!isPlatformAdmin) {
    redirect('/');
  }

  // Fetch Tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (!tenant) {
    redirect('/tenants?err=Organización%20no%20encontrada');
  }

  // Fetch Billing Config
  const { data: billingConfig } = await supabase
    .from('tenant_billing_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  // Fetch recent invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10);

  async function saveBillingConfigAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const ruc = String(formData.get('ruc') || '').trim();
    const legalName = String(formData.get('legalName') || '').trim();
    const tradename = String(formData.get('tradename') || '').trim();
    const address = String(formData.get('address') || '').trim();
    const establishmentCode = String(formData.get('establishmentCode') || '001').trim();
    const emissionPointCode = String(formData.get('emissionPointCode') || '001').trim();
    const cipherbyteApiKey = String(formData.get('cipherbyteApiKey') || '').trim();
    const environment = String(formData.get('environment') || 'test') as 'test' | 'production';
    const forcedAccounting = formData.get('forcedAccounting') === 'true';
    const isActive = formData.get('isActive') === 'true';

    if (!ruc || !legalName) {
      redirect(`/tenants/${tenantId}/billing?err=El%20RUC%20y%20la%20Raz%C3%B3n%20Social%20son%20obligatorios`);
    }

    const { error } = await supabase.from('tenant_billing_configs').upsert({
      tenant_id: tenantId,
      ruc,
      legal_name: legalName,
      tradename: tradename || null,
      address: address || null,
      establishment_code: establishmentCode,
      emission_point_code: emissionPointCode,
      cipherbyte_api_key: cipherbyteApiKey || null,
      environment,
      forced_accounting: forcedAccounting,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      redirect(`/tenants/${tenantId}/billing?err=${encodeURIComponent(error.message)}`);
    }

    revalidatePath(`/tenants/${tenantId}/billing`);
    redirect(`/tenants/${tenantId}/billing?ok=Configuraci%C3%B3n%20fiscal%20guardada%20con%20%C3%A9xito`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 font-sans">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/tenants" className="hover:underline">Organizaciones</Link>
            <span>/</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{tenant.name}</span>
            <span>/</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Facturación SRI (CipherByte)</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Configuración Fiscal & SRI • {tenant.name}
          </h1>
          <p className="text-xs text-neutral-500">
            Administra los datos tributarios, punto de emisión y API Key de CipherByte para este negocio.
          </p>
        </div>

        <Link
          href="/tenants"
          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Volver a Organizaciones
        </Link>
      </div>

      {queryParams.ok && (
        <div className="mb-6 rounded-md bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ {queryParams.ok}
        </div>
      )}
      {queryParams.err && (
        <div className="mb-6 rounded-md bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ {queryParams.err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Parámetros de Emisión Electrónica
              </h2>
              <p className="text-[11px] text-neutral-500">
                Estos datos se utilizarán para la firma XAdES-BES y autorización ante el SRI.
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-mono font-bold text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300">
              Gateway CipherByte
            </span>
          </div>

          <form action={saveBillingConfigAction} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  RUC del Negocio (13 dígitos) *
                </label>
                <input
                  type="text"
                  name="ruc"
                  required
                  maxLength={13}
                  defaultValue={billingConfig?.ruc || ''}
                  placeholder="Ej. 1790012345001"
                  className="mt-1 block w-full font-mono rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Razón Social Oficial (SRI) *
                </label>
                <input
                  type="text"
                  name="legalName"
                  required
                  defaultValue={billingConfig?.legal_name || tenant.name}
                  placeholder="Ej. COMERCIAL TALLERES S.A.S."
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Nombre Comercial (Opcional)
                </label>
                <input
                  type="text"
                  name="tradename"
                  defaultValue={billingConfig?.tradename || tenant.name}
                  placeholder="Ej. Taller Central Pro"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Dirección Matriz
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={billingConfig?.address || ''}
                  placeholder="Ej. Av. América y Naciones Unidas"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Establecimiento
                </label>
                <input
                  type="text"
                  name="establishmentCode"
                  required
                  maxLength={3}
                  defaultValue={billingConfig?.establishment_code || '001'}
                  className="mt-1 block w-full font-mono rounded-lg border border-neutral-300 px-3 py-2 text-xs text-center dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Punto de Emisión
                </label>
                <input
                  type="text"
                  name="emissionPointCode"
                  required
                  maxLength={3}
                  defaultValue={billingConfig?.emission_point_code || '001'}
                  className="mt-1 block w-full font-mono rounded-lg border border-neutral-300 px-3 py-2 text-xs text-center dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Ambiente SRI
                </label>
                <select
                  name="environment"
                  defaultValue={billingConfig?.environment || 'test'}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <option value="test">🧪 Pruebas / Sandbox</option>
                  <option value="production">🚀 Producción (SRI Real)</option>
                </select>
              </div>
            </div>

            {/* CipherByte Secret API Key */}
            <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                API Key de CipherByte (X-Api-Key)
              </label>
              <input
                type="password"
                name="cipherbyteApiKey"
                defaultValue={billingConfig?.cipherbyte_api_key || ''}
                placeholder="sk_live_... o sk_test_..."
                className="mt-1 block w-full font-mono rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
              <p className="mt-1 text-[11px] text-neutral-400">
                Ingresa la clave generada en <a href="https://gateway.cipherbyte.ec/dashboard" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">gateway.cipherbyte.ec</a> vinculada al RUC del cliente.
              </p>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="forcedAccounting"
                  value="true"
                  defaultChecked={billingConfig?.forced_accounting || false}
                  className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Obligado a llevar contabilidad (SRI)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked={billingConfig ? billingConfig.is_active : true}
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Módulo de Facturación Habilitado</span>
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition active:scale-98"
            >
              Guardar Configuración Fiscal en CipherByte
            </button>
          </form>
        </div>

        {/* Informational Card & Recent Invoices */}
        <div className="space-y-6">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
            <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
              Guía de Onboarding Guante Blanco
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
              <li>
                Sube la firma digital <code>.p12</code> del cliente en{' '}
                <a
                  href="https://gateway.cipherbyte.ec/comprobantes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline"
                >
                  gateway.cipherbyte.ec
                </a>.
              </li>
              <li>
                Copia la API Key y pégala en este formulario.
              </li>
              <li>
                Guarda los cambios: el cliente tendrá automáticamente el botón de facturar en su módulo.
              </li>
            </ol>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Últimas Facturas Emitidas ({invoices?.length || 0})
            </h3>
            {!invoices || invoices.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">
                Aún no se han emitido facturas para esta organización.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100 text-xs dark:divide-neutral-800">
                {invoices.map((inv) => (
                  <li key={inv.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {inv.invoice_number}
                      </span>
                      <p className="text-[10px] text-neutral-400 truncate max-w-[160px]">
                        {inv.customer_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                        ${Number(inv.total_amount).toFixed(2)}
                      </span>
                      <span
                        className={`block text-[9px] font-bold uppercase ${
                          inv.status === 'authorized'
                            ? 'text-emerald-600'
                            : inv.status === 'rejected'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
