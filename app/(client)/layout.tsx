import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { getUserRoleInfo } from '@/lib/tenancy/role';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const roleInfo = await getUserRoleInfo(supabase);

  return (
    <AppShell
      userEmail={user?.email}
      businessType="financial_receipts"
      roleLabel={roleInfo.label}
      roleBadgeColor={roleInfo.badgeColor}
      isPlatformAdmin={roleInfo.isPlatformAdmin}
    >
      {children}
    </AppShell>
  );
}
