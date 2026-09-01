import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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
    },
    {
      title: 'Portal de Clientes',
      description: 'Portal para clientes y usuarios: carga directa de comprobantes y seguimiento del estado de validación en tiempo real.',
      href: '/portal',
      badge: 'Clientes',
    },
    {
      title: 'Cargar Comprobantes',
      description: 'Ingreso y procesamiento manual de comprobantes bancarios con almacenamiento inmutable y escaneo automático OCR y QR.',
      href: '/upload',
      badge: 'Operador',
    },
    {
      title: 'Repositorio de Comprobantes',
      description: 'Bandeja general, revisión a cuatro ojos, historial de auditoría y detección automática de posibles fraudes.',
      href: '/receipts',
      badge: 'Operador',
    },
    {
      title: 'Métricas & Reportes',
      description: 'Analíticas en tiempo real por sucursal, tasa de éxito en verificación criptográfica QR y exportación a CSV.',
      href: '/metrics',
      badge: 'Analítica',
    },
    {
      title: 'Claves Públicas Bancarias',
      description: 'Gestión y activación de claves criptográficas Ed25519 por institución financiera para validación QR.',
      href: '/settings/keys',
      badge: 'Admin',
    },
    {
      title: 'Cuentas Beneficiarias',
      description: 'Configuración de cuentas bancarias de destino autorizadas para conciliación automática y alertas.',
      href: '/settings/beneficiaries',
      badge: 'Admin',
    },
    {
      title: 'Sucursales & Usuarios',
      description: 'Administración de sucursales físicas, asignación de membresías y control de roles multi-inquilino.',
      href: '/settings/branches',
      badge: 'Admin',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-neutral-900 dark:bg-black dark:text-neutral-100">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <header className="mb-12 border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Centro de Control Empresarial
                </span>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300">
                  {APP_VERSION}
                </span>
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
                JanusCore Pro
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Verificación de Comprobantes, Validación Criptográfica Ed25519 & Gestión de Servicios
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {user.email}
                  </span>
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="rounded bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                      Cerrar Sesión
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  Iniciar Sesión →
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((sec) => (
            <Link
              key={sec.title}
              href={sec.href}
              className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {sec.badge}
                  </span>
                  <span className="text-xs font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100 dark:text-indigo-400">
                    Ingresar →
                  </span>
                </div>
                <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {sec.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {sec.description}
                </p>
              </div>
            </Link>
          ))}
        </section>

        <footer className="mt-auto border-t border-neutral-200 pt-8 text-center text-xs text-neutral-400 dark:border-neutral-800">
          <p>
            Desarrollado con <strong className="font-semibold text-neutral-600 dark:text-neutral-300">januscore.pro</strong> • Seguridad Multi-inquilino RLS & Criptografía • <span className="font-mono text-[11px] font-bold text-neutral-500">{APP_VERSION}</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
