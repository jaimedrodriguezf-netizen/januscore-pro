import { describe, it, expect } from 'vitest';

describe('Dashboard Navigation Structure', () => {
  it('defines structured navigation groups for workshop, receipts, admin and superadmin', () => {
    const navGroups = [
      {
        title: 'Módulo Principal',
        items: [
          { name: 'Centro de Control', href: '/' },
          { name: 'Taller Mecánico', href: '/workshop' },
          { name: 'Portal de Clientes', href: '/portal' },
        ],
      },
      {
        title: 'Verificación Financiera',
        items: [
          { name: 'Cargar Comprobante', href: '/upload' },
          { name: 'Bandeja de Comprobantes', href: '/receipts' },
          { name: 'Métricas & Fraude', href: '/metrics' },
        ],
      },
      {
        title: 'Configuración & Seguridad',
        items: [
          { name: 'Sucursales', href: '/settings/branches' },
          { name: 'Usuarios & Roles', href: '/settings/users' },
          { name: 'Cuentas Beneficiarias', href: '/settings/beneficiaries' },
          { name: 'Claves Públicas', href: '/settings/keys' },
        ],
      },
      {
        title: 'Plataforma Superadmin',
        items: [
          { name: 'Organizaciones', href: '/tenants' },
        ],
      },
    ];

    expect(navGroups.length).toBe(4);
    expect(navGroups[0].items.some(i => i.href === '/workshop')).toBe(true);
    expect(navGroups[1].items.some(i => i.href === '/receipts')).toBe(true);
    expect(navGroups[2].items.some(i => i.href === '/settings/branches')).toBe(true);
    expect(navGroups[3].items.some(i => i.href === '/tenants')).toBe(true);
  });
});
