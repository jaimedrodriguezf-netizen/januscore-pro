import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { WorkshopNavigation } from '@/components/mechanics/workshop-navigation';
import { WorkshopProfileSettings } from '@/components/mechanics/workshop-profile-settings';
import { sanitizeSlug, type WorkshopProfile } from '@/lib/mechanics/workshop-profile';

export const dynamic = 'force-dynamic';

export default async function WorkshopSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; ok?: string; err?: string }>;
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

  if (!activeTenantId) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-400">No hay organizaciones asignadas a este usuario.</p>
      </div>
    );
  }

  // Fetch active tenant profile
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', activeTenantId)
    .maybeSingle();

  const workshopProfile: WorkshopProfile = {
    id: activeTenantId,
    name: tenantData?.name || 'Mi Mecánica',
    slug: tenantData?.slug || 'taller',
    logoUrl: tenantData?.logo_url,
    whatsappPhone: tenantData?.whatsapp_phone,
    phone: tenantData?.phone,
    address: tenantData?.address,
    city: tenantData?.city,
    googleMapsUrl: tenantData?.google_maps_url,
    operatingHours: tenantData?.operating_hours,
    description: tenantData?.description,
    isActive: tenantData?.is_active ?? true,
  };

  async function saveWorkshopProfileAction(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const tId = String(formData.get('tenantId') || '');
    const name = String(formData.get('name') || '').trim();
    const rawSlug = String(formData.get('slug') || '').trim();
    const logoUrl = String(formData.get('logoUrl') || '').trim() || null;
    const whatsappPhone = String(formData.get('whatsappPhone') || '').trim() || null;
    const phone = String(formData.get('phone') || '').trim() || null;
    const address = String(formData.get('address') || '').trim() || null;
    const city = String(formData.get('city') || '').trim() || null;
    const googleMapsUrl = String(formData.get('googleMapsUrl') || '').trim() || null;
    const operatingHours = String(formData.get('operatingHours') || '').trim() || null;
    const description = String(formData.get('description') || '').trim() || null;

    const slug = sanitizeSlug(rawSlug || name);

    if (tId && name && slug) {
      await supabase
        .from('tenants')
        .update({
          name,
          slug,
          logo_url: logoUrl,
          whatsapp_phone: whatsappPhone,
          phone,
          address,
          city,
          google_maps_url: googleMapsUrl,
          operating_hours: operatingHours,
          description,
        })
        .eq('id', tId);

      revalidatePath('/workshop');
      revalidatePath('/workshop/settings');
      revalidatePath(`/m/${slug}`);
      redirect(`/workshop/settings?tenantId=${tId}&ok=Perfil%20del%20taller%20guardado%20exitosamente`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Workshop Module Sub-Navigation */}
      <WorkshopNavigation
        tenantId={activeTenantId}
        workshopSlug={workshopProfile.slug}
      />

      {params.ok && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs font-bold text-emerald-300">
          ✓ {params.ok}
        </div>
      )}

      {/* Workshop Settings Component */}
      <WorkshopProfileSettings
        initialProfile={workshopProfile}
        onSaveAction={saveWorkshopProfileAction}
      />
    </div>
  );
}
