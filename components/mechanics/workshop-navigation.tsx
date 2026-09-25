'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface WorkshopNavigationProps {
  tenantId?: string;
  totalVehicles?: number;
  workshopSlug?: string;
}

export function WorkshopNavigation({
  tenantId,
  totalVehicles,
  workshopSlug,
}: WorkshopNavigationProps) {
  const pathname = usePathname();
  const queryParam = tenantId ? `?tenantId=${tenantId}` : '';

  const navItems = [
    {
      name: '📋 Órdenes & Vehículos',
      badge: typeof totalVehicles === 'number' ? totalVehicles : undefined,
      href: `/workshop${queryParam}`,
      active: pathname === '/workshop',
    },
    {
      name: '👥 Clientes',
      href: `/workshop/clients${queryParam}`,
      active: pathname === '/workshop/clients',
    },
    {
      name: '📚 Catálogo OEM 100+',
      href: `/workshop/templates${queryParam}`,
      active: pathname === '/workshop/templates',
    },
    {
      name: '⚙️ Configuración del Taller',
      href: `/workshop/settings${queryParam}`,
      active: pathname === '/workshop/settings',
    },
    {
      name: '🖨️ Plancha A4 (Stickers)',
      href: `/workshop/print-sheet${queryParam}`,
      active: pathname === '/workshop/print-sheet',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              item.active
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{item.name}</span>
            {item.badge !== undefined && (
              <span className="rounded-full bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Quick Action Links: Public Portal & Support */}
      <div className="flex flex-wrap items-center gap-2">
        {workshopSlug && (
          <a
            href={`/m/${workshopSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900/40 hover:border-indigo-400 transition"
          >
            <span>🌐 Ver Portal Público de Marca</span>
            <span className="font-mono text-[11px] opacity-75">/m/{workshopSlug} ↗</span>
          </a>
        )}

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('open-support-modal'));
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:border-rose-400 transition cursor-pointer"
          title="Reportar una falla técnica o enviar consulta"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>🎧 Soporte / Reportar Falla</span>
        </button>
      </div>
    </div>
  );
}
