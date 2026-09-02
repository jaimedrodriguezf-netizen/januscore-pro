import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <AppShell userEmail={user?.email}>{children}</AppShell>;
}
