import { describe, it, expect } from 'vitest';
import {
  buildClientDetailedProfile,
  type VehicleWithFullRecords,
} from '@/lib/mechanics/client-history';

describe('Client Work Orders History Domain (TDD)', () => {
  const mockVehicles: VehicleWithFullRecords[] = [
    {
      id: 'veh-1',
      tenant_id: 'ten-1',
      plate: 'PBX-1001',
      brand: 'Chevrolet',
      model: 'D-Max',
      year: 2021,
      current_mileage: 50000,
      owner_name: 'Jaime Rodríguez',
      owner_identification: '0923456789',
      owner_phone: '0991234567',
      owner_email: 'jaime@example.com',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      maintenance_records: [
        {
          id: 'rec-1',
          tenant_id: 'ten-1',
          vehicle_id: 'veh-1',
          service_date: '2025-06-15T10:00:00Z',
          mileage: 40000,
          service_type: 'oil_change',
          description: 'Cambio de aceite sintético 5W-30 y filtro',
          technician_name: 'Carlos Mendoza',
          cost: 45.5,
          status: 'completed',
          created_at: '2025-06-15T10:00:00Z',
        },
        {
          id: 'rec-2',
          tenant_id: 'ten-1',
          vehicle_id: 'veh-1',
          service_date: '2025-11-20T14:30:00Z',
          mileage: 48000,
          service_type: 'brakes',
          description: 'ABC de frenos y pastillas delanteras',
          technician_name: 'Carlos Mendoza',
          cost: 80.0,
          status: 'completed',
          created_at: '2025-11-20T14:30:00Z',
        },
      ],
    },
    {
      id: 'veh-2',
      tenant_id: 'ten-1',
      plate: 'GS-2002',
      brand: 'Toyota',
      model: 'Hilux',
      year: 2023,
      current_mileage: 25000,
      owner_name: 'Jaime Rodríguez',
      owner_identification: '0923456789',
      owner_phone: '0991234567',
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z',
      maintenance_records: [
        {
          id: 'rec-3',
          tenant_id: 'ten-1',
          vehicle_id: 'veh-2',
          service_date: '2026-02-10T09:00:00Z',
          mileage: 25000,
          service_type: 'full_abc',
          description: 'Mantenimiento Preventivo 25,000 km',
          technician_name: 'Fabricio Pilozo',
          cost: 120.0,
          status: 'completed',
          created_at: '2026-02-10T09:00:00Z',
        },
      ],
    },
  ];

  it('consolidates work orders across all owned vehicles in descending chronological order', () => {
    const profile = buildClientDetailedProfile('id:0923456789', mockVehicles);

    expect(profile).not.toBeNull();
    expect(profile?.name).toBe('Jaime Rodríguez');
    expect(profile?.identification).toBe('0923456789');
    expect(profile?.vehicles.length).toBe(2);
    expect(profile?.workOrders.length).toBe(3);

    // Sorted descending: rec-3 (2026-02-10) -> rec-2 (2025-11-20) -> rec-1 (2025-06-15)
    expect(profile?.workOrders[0].id).toBe('rec-3');
    expect(profile?.workOrders[0].vehiclePlate).toBe('GS-2002');
    expect(profile?.workOrders[1].id).toBe('rec-2');
    expect(profile?.workOrders[2].id).toBe('rec-1');
  });

  it('calculates totalSpent, totalServices, and visit timeline accurately', () => {
    const profile = buildClientDetailedProfile('id:0923456789', mockVehicles);

    expect(profile?.totalServices).toBe(3);
    // 45.5 + 80.0 + 120.0 = 245.5
    expect(profile?.totalSpent).toBe(245.5);
    expect(profile?.firstVisitDate).toBe('2025-06-15T10:00:00Z');
    expect(profile?.lastVisitDate).toBe('2026-02-10T09:00:00Z');
  });

  it('returns null if client key is not found', () => {
    const profile = buildClientDetailedProfile('id:9999999999', mockVehicles);
    expect(profile).toBeNull();
  });
});
