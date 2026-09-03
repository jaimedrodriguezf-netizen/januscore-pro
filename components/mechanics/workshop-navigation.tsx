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
      href: `/workshop${queryParam}`,
      active: pathname === '/workshop',
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
          </Link>
        ))}
      </div>

      {/* Quick Public Portal Link */}
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
    </div>
  );
}
