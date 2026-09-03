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

  // Fetch tenant information for logo / name / slug
  let tenantName = 'JanusCore Auto Service';
  let targetUrl = 'https://januscore.pro/auto';
  let workshopPhone: string | undefined = undefined;
  let logoUrl: string | undefined = undefined;

  if (activeTenantId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, slug, logo_url, whatsapp_phone, phone')
      .eq('id', activeTenantId)
      .maybeSingle();

    if (tenant?.name) {
      tenantName = tenant.name;
    }
    if (tenant?.whatsapp_phone || tenant?.phone) {
      workshopPhone = tenant.whatsapp_phone || tenant.phone || undefined;
    }
    if (tenant?.logo_url) {
      logoUrl = tenant.logo_url;
    }

    if (tenant?.slug) {
      targetUrl = params.plate
        ? `https://januscore.pro/m/${tenant.slug}/${encodeURIComponent(params.plate)}`
        : `https://januscore.pro/m/${tenant.slug}`;
    } else {
      targetUrl = params.plate
        ? `https://januscore.pro/auto/${encodeURIComponent(params.plate)}`
        : 'https://januscore.pro/auto';
    }
  }

  const stickerData = await generatePrintableStickerData({
    tenantName,
    targetUrl,
    plate: params.plate,
    workshopPhone,
    logoUrl,
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
