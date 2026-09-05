import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { getUserRoleInfo } from '@/lib/tenancy/role';
import { AppShell } from '@/components/layout/app-shell';
import { LandingPage } from '@/components/landing/landing-page';
import { APP_VERSION } from '@/lib/version';

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  const tenantIds = await getAccessibleTenantIds(supabase);
  const roleInfo = await getUserRoleInfo(supabase, tenantIds[0]);

  // If the user has no tenant and is not a platform superadmin, show unassigned view
  if (tenantIds.length === 0 && !roleInfo.isPlatformAdmin) {
    return (
      <AppShell
        userEmail={user.email}
        businessType="all"
        roleLabel={roleInfo.label}
        roleBadgeColor={roleInfo.badgeColor}
        isPlatformAdmin={false}
      >
        <div className="mx-auto max-w-2xl py-16 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl">
            ⏳
          </div>
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-mono text-xs font-bold text-amber-300">
              {roleInfo.label}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Cuenta Registrada en JanusCore Pro
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              Tu cuenta (<strong className="text-white">{user.email}</strong>) ha sido verificada, pero aún no perteneces a ninguna organización o empresa activa.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Para acceder a los módulos de trabajo (Taller Mecánico, Comprobantes o Catálogo), el administrador de tu negocio o el Superadmin debe invitarte o asignarte tu rol desde el panel de usuarios.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auto"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <span>🔍 Consultar Ficha QR de Taller</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  let businessType: 'all' | 'mechanics' | 'financial_receipts' = 'all';
  let tenantName = 'Tu Organización';

  if (tenantIds.length > 0) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_type, name')
      .eq('id', tenantIds[0])
      .maybeSingle();

    if (tenant?.business_type) {
      businessType = tenant.business_type as 'all' | 'mechanics' | 'financial_receipts';
    }
    if (tenant?.name) {
      tenantName = tenant.name;
    }
  }

  const allSections = [
    {
      title: 'Órdenes de Trabajo & Flotas',
      description: 'Control de vehículos, órdenes de servicio, inspección 2D de carrocería y stickers QR para parabrisas.',
      href: '/workshop',
      badge: 'Taller',
      icon: '🔧',
      color: 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'mechanics'],
    },
    {
      title: 'Catálogo OEM & Fichas 100+',
      description: 'Catálogo oficial de más de 136 modelos con especificaciones y creador de fichas de mantenimiento.',
      href: '/workshop/templates',
      badge: 'Fichas',
      icon: '📚',
      color: 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'mechanics'],
    },
    {
      title: 'Ajustes del Taller & Marca',
      description: 'Configuración del logo, WhatsApp oficial de agendamiento, Google Maps, horarios y enlace de marca /m/[slug].',
      href: '/workshop/settings',
      badge: 'Perfil',
      icon: '⚙️',
      color: 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'mechanics'],
    },
    {
      title: 'Plancha A4 (15 Stickers)',
      description: 'Generación e impresión de planchas de stickers QR con los datos de contacto y logo de tu mecánica.',
      href: '/workshop/print-sheet',
      badge: 'Impresión',
      icon: '🖨️',
      color: 'border-slate-800 hover:border-blue-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'mechanics'],
    },
    {
      title: 'Cargar Comprobantes',
      description: 'Ingreso y procesamiento manual de comprobantes bancarios con almacenamiento inmutable y escaneo OCR y QR.',
      href: '/upload',
      badge: 'Operador',
      icon: '📥',
      color: 'border-slate-800 hover:border-blue-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'financial_receipts'],
    },
    {
      title: 'Bandeja de Comprobantes',
      description: 'Bandeja general, revisión a cuatro ojos, historial de auditoría y detección automática de posibles fraudes.',
      href: '/receipts',
      badge: 'Operador',
      icon: '📋',
      color: 'border-slate-800 hover:border-amber-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'financial_receipts'],
    },
    {
      title: 'Métricas & Reportes',
      description: 'Analíticas en tiempo real por sucursal, tasa de éxito en verificación criptográfica QR y exportación a CSV.',
      href: '/metrics',
      badge: 'Analítica',
      icon: '📊',
      color: 'border-slate-800 hover:border-purple-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'financial_receipts'],
    },
    {
      title: 'Portal de Clientes',
      description: 'Portal para clientes y usuarios: carga directa de comprobantes y seguimiento del estado de validación.',
      href: '/portal',
      badge: 'Clientes',
      icon: '👤',
      color: 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'financial_receipts'],
    },
    {
      title: 'Sucursales & Sedes',
      description: 'Administración de sucursales físicas, asignación de membresías y control de roles multi-inquilino.',
      href: '/settings/branches',
      badge: 'Admin',
      icon: '🏢',
      color: 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'mechanics', 'financial_receipts'],
    },
    {
      title: 'Usuarios & Permisos',
      description: 'Asignación de roles de operador, administrador y cliente con aislamiento estricto por sucursal.',
      href: '/settings/users',
      badge: 'Admin',
      icon: '👥',
      color: 'border-slate-800 hover:border-teal-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'mechanics', 'financial_receipts'],
    },
    {
      title: 'Cuentas Beneficiarias',
      description: 'Configuración de cuentas bancarias de destino autorizadas para conciliación automática y alertas.',
      href: '/settings/beneficiaries',
      badge: 'Admin',
      icon: '🏦',
      color: 'border-slate-800 hover:border-rose-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'financial_receipts'],
    },
    {
      title: 'Claves Públicas Ed25519',
      description: 'Gestión y activación de claves criptográficas por banco para validación de firmas digitales QR.',
      href: '/settings/keys',
      badge: 'Admin',
      icon: '🔑',
      color: 'border-slate-800 hover:border-yellow-500/50 bg-slate-900/60',
      forBusinessType: ['all', 'financial_receipts'],
    },
  ];

  const sections = allSections.filter((s) => {
    if (!('forBusinessType' in s) || !s.forBusinessType) return true;
    return s.forBusinessType.includes(businessType);
  });

  const content = (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Centro de Control • {tenantName}
            </span>
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${roleInfo.badgeColor}`}>
              {roleInfo.label}
            </span>
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
              {businessType === 'mechanics'
                ? '🚗 Taller Mecánico'
                : businessType === 'financial_receipts'
                ? '💳 Verificación Financiera'
                : '🏢 Multi-Negocio'}
            </span>
            <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-400">
              {APP_VERSION}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            {businessType === 'mechanics' ? 'Gestión Automotriz & Fichas QR' : 'JanusCore Pro'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            {businessType === 'mechanics'
              ? 'Control de vehículos, órdenes de servicio, proyección de mantenimientos y portal de marca'
              : 'Plataforma Integral de Verificación de Pagos, Auditoría & Control de Negocios'}
          </p>
        </div>

        {!user && (
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            Iniciar Sesión →
          </Link>
        )}
      </div>

      {/* Grid of Work Modules */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((sec) => (
          <Link
            key={sec.title}
            href={sec.href}
            className={`group flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${sec.color}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{sec.icon}</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700/60">
                  {sec.badge}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                {sec.title}
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {sec.description}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Acceder al módulo</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <AppShell
      userEmail={user.email}
      businessType={businessType}
      roleLabel={roleInfo.label}
      roleBadgeColor={roleInfo.badgeColor}
      isPlatformAdmin={roleInfo.isPlatformAdmin}
    >
      {content}
    </AppShell>
  );
}

