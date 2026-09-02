'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  userEmail?: string | null;
  onOpenSidebar: () => void;
}

export function Header({ userEmail, onOpenSidebar }: HeaderProps) {
  const pathname = usePathname();

  // Helper to format breadcrumbs
  const pathSegments = pathname.split('/').filter(Boolean);
  const titleMap: Record<string, string> = {
    workshop: 'Taller Mecánico',
    portal: 'Portal de Clientes',
    upload: 'Cargar Comprobante',
    receipts: 'Bandeja de Comprobantes',
    metrics: 'Métricas & Reportes',
    settings: 'Configuración',
    branches: 'Sucursales',
    users: 'Usuarios & Roles',
    beneficiaries: 'Cuentas Beneficiarias',
    keys: 'Claves Públicas Ed25519',
    tenants: 'Organizaciones (Superadmin)',
    auto: 'Ficha Vehicular',
  };

  const currentTitle = pathSegments.length > 0 ? titleMap[pathSegments[pathSegments.length - 1]] || 'Panel' : 'Centro de Control';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
          aria-label="Abrir menú"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-200 transition">
            Inicio
          </Link>
          {pathSegments.map((segment, idx) => {
            const isLast = idx === pathSegments.length - 1;
            const segmentTitle = titleMap[segment] || segment;
            return (
              <span key={segment} className="flex items-center gap-2">
                <span className="text-slate-600">/</span>
                <span className={isLast ? 'font-semibold text-slate-200' : 'hover:text-slate-200'}>
                  {segmentTitle}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/upload"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
        >
          <span>+ Cargar Comprobante</span>
        </Link>
        <Link
          href="/workshop"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
        >
          <span>🔧 Taller</span>
        </Link>

        {userEmail && (
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="max-w-[140px] truncate sm:max-w-none">{userEmail}</span>
          </div>
        )}
      </div>
    </header>
  );
}
