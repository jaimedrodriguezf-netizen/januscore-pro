import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { calculateA4SheetLayout, generatePrintableStickerData } from '@/lib/mechanics/printable-sheet';
import { PrintableSheet } from '@/components/mechanics/printable-sheet';

export const dynamic = 'force-dynamic';

export default async function WorkshopPrintSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; plate?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const tenantIds = await getAccessibleTenantIds(supabase);
  const activeTenantId = params.tenantId || tenantIds[0];

  // Fetch tenant information for logo / name
  let tenantName = 'JanusCore Auto Service';
  if (activeTenantId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', activeTenantId)
      .maybeSingle();
    if (tenant?.name) {
      tenantName = tenant.name;
    }
  }

  const targetUrl = params.plate
    ? `https://januscore.pro/auto/${encodeURIComponent(params.plate)}`
    : 'https://januscore.pro/auto';

  const stickerData = await generatePrintableStickerData({
    tenantName,
    targetUrl,
    plate: params.plate,
  });

  const layout = calculateA4SheetLayout({ totalStickers: 15, columns: 3 });

  return (
    <PrintableSheet
      stickerData={stickerData}
      layout={layout}
      vehiclePlate={params.plate}
      tenantName={tenantName}
    />
  );
}
