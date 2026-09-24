import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TicketList, SupportTicketItem } from './ticket-list';

export const metadata = {
  title: 'Mesa de Ayuda & Soporte Técnico (Superadmin) | JanusCore',
  description: 'Gestión centralizada de tickets de soporte técnico e incidencias de usuarios.',
};

export default async function SuperadminSupportPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 font-sans">
        <p className="text-sm text-neutral-400">Por favor inicia sesión para acceder al panel de superadministrador.</p>
      </main>
    );
  }

  // Check platform superadmin status
  const { data: isPlatformAdmin } = await supabase.rpc('am_i_platform_admin');
  if (!isPlatformAdmin) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 font-sans">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
          ⚠️ Acceso Denegado: Se requieren privilegios de Superadministrador de la Plataforma.
        </div>
      </main>
    );
  }

  // Fetch tickets with user profile and tenant information
  const { data: rawTickets, error } = await supabase
    .from('support_tickets')
    .select(`
      id,
      user_id,
      tenant_id,
      category,
      priority,
      subject,
      message,
      attachment_path,
      status,
      metadata,
      admin_notes,
      resolved_at,
      created_at,
      updated_at,
      profiles:user_id (
        email,
        full_name
      ),
      tenants:tenant_id (
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SupportPage] Error fetching tickets:', error);
  }

  const tickets = (rawTickets || []) as unknown as SupportTicketItem[];

  // Metric counts
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:underline">Inicio</Link>
            <span>/</span>
            <span className="text-slate-300">Soporte Técnico</span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
            Mesa de Ayuda & Incidencias
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Gestión de consultas, errores reportados y capturas de pantalla de los usuarios en tiempo real.
          </p>
        </div>
      </div>

      {/* Metrics Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-medium text-slate-400">Total Recibidos</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{totalCount}</p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-xs font-medium text-rose-400">Abiertos (Pendientes)</p>
          <p className="mt-1 text-2xl font-bold text-rose-400">{openCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs font-medium text-amber-400">En Proceso</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{inProgressCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs font-medium text-emerald-400">Resueltos / Cerrados</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{resolvedCount}</p>
        </div>
      </div>

      {/* Main Interactive Ticket List */}
      <TicketList initialTickets={tickets} />
    </main>
  );
}
