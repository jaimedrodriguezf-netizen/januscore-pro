import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { WorkshopNavigation } from '@/components/mechanics/workshop-navigation';
import { TemplateExplorer } from '@/components/mechanics/template-explorer';

export const dynamic = 'force-dynamic';

export default async function WorkshopTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
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

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', activeTenantId)
    .maybeSingle();

  return (
    <div className="space-y-6">
      {/* Workshop Module Sub-Navigation */}
      <WorkshopNavigation
        tenantId={activeTenantId}
        workshopSlug={tenantData?.slug}
      />

      {/* OEM 100+ Catalog & Custom Template Creator */}
      <TemplateExplorer />
    </div>
  );
}
