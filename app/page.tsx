import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { APP_VERSION } from '@/lib/version';

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sections = [
    {
      title: 'Taller Mecánico & QR',
      description: 'Control de vehículos, órdenes de servicio, proyección de próximos mantenimientos y stickers QR para parabrisas.',
      href: '/workshop',
      badge: 'Mecánica',
      icon: '🔧',
      color: 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/60',
    },
    {
      title: 'Portal de Clientes',
      description: 'Portal para clientes y usuarios: carga directa de comprobantes y seguimiento del estado de validación en tiempo real.',
      href: '/portal',
      badge: 'Clientes',
      icon: '👤',
      color: 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/60',
    },
    {
      title: 'Cargar Comprobantes',
      description: 'Ingreso y procesamiento manual de comprobantes bancarios con almacenamiento inmutable y escaneo automático OCR y QR.',
      href: '/upload',
      badge: 'Operador',
      icon: '📥',
      color: 'border-slate-800 hover:border-blue-500/50 bg-slate-900/60',
    },
    {
      title: 'Bandeja de Comprobantes',
      description: 'Bandeja general, revisión a cuatro ojos, historial de auditoría y detección automática de posibles fraudes.',
      href: '/receipts',
      badge: 'Operador',
      icon: '📋',
      color: 'border-slate-800 hover:border-amber-500/50 bg-slate-900/60',
    },
    {
      title: 'Métricas & Reportes',
      description: 'Analíticas en tiempo real por sucursal, tasa de éxito en verificación criptográfica QR y exportación a CSV.',
      href: '/metrics',
      badge: 'Analítica',
      icon: '📊',
      color: 'border-slate-800 hover:border-purple-500/50 bg-slate-900/60',
    },
    {
      title: 'Sucursales & Sedes',
      description: 'Administración de sucursales físicas, asignación de membresías y control de roles multi-inquilino.',
      href: '/settings/branches',
      badge: 'Admin',
      icon: '🏢',
      color: 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/60',
    },
    {
      title: 'Usuarios & Permisos',
      description: 'Asignación de roles de operador, administrador y cliente con aislamiento estricto por sucursal.',
      href: '/settings/users',
      badge: 'Admin',
      icon: '👥',
      color: 'border-slate-800 hover:border-teal-500/50 bg-slate-900/60',
    },
    {
      title: 'Cuentas Beneficiarias',
      description: 'Configuración de cuentas bancarias de destino autorizadas para conciliación automática y alertas.',
      href: '/settings/beneficiaries',
      badge: 'Admin',
      icon: '🏦',
      color: 'border-slate-800 hover:border-rose-500/50 bg-slate-900/60',
    },
    {
      title: 'Claves Públicas Ed25519',
      description: 'Gestión y activación de claves criptográficas por banco para validación de firmas digitales QR.',
      href: '/settings/keys',
      badge: 'Admin',
      icon: '🔑',
      color: 'border-slate-800 hover:border-yellow-500/50 bg-slate-900/60',
    },
  ];

  const content = (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Centro de Control Empresarial
            </span>
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
              {APP_VERSION}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            JanusCore Pro
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Plataforma Integral de Verificación de Pagos, Auditoría & Gestión de Taller Mecánico
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
                <span className="text-xl">{sec.icon}</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-slate-700">
                  {sec.badge}
                </span>
              </div>
              <h2 className="mt-3 text-base font-bold tracking-tight text-slate-100 group-hover:text-indigo-400 transition-colors">
                {sec.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                {sec.description}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
              <span>Acceder al módulo</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  if (user) {
    return <AppShell userEmail={user.email}>{content}</AppShell>;
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-6 lg:p-12">
      <div className="mx-auto max-w-6xl">{content}</div>
    </div>
  );
}
