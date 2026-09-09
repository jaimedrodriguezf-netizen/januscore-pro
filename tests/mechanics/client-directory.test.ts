import { describe, expect, it } from 'vitest';
import {
  aggregateWorkshopClients,
  computeClientKPIs,
  filterWorkshopClients,
  type VehicleWithRecords,
} from '@/lib/mechanics/client-directory';

describe('Workshop Client Directory Domain & Aggregator (TDD)', () => {
  const sampleVehicles: VehicleWithRecords[] = [
    {
      id: 'v1',
      tenant_id: 't1',
      plate: 'PBA-1001',
      brand: 'Chevrolet',
      model: 'D-Max',
      year: 2021,
      owner_name: 'Jaime Rodriguez',
      owner_identification: '1719623512',
      owner_phone: '0983144424',
      owner_email: 'jaime@example.com',
      current_mileage: 65000,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
      maintenance_records: [
        { id: 'm1', service_date: '2026-01-10T10:00:00Z' },
        { id: 'm2', service_date: '2026-03-01T10:00:00Z' },
      ],
    },
    {
      id: 'v2',
      tenant_id: 't1',
      plate: 'PBA-1002',
      brand: 'Toyota',
      model: 'Hilux',
      year: 2023,
      owner_name: 'Jaime Rodriguez Flores',
      owner_identification: '1719623512',
      owner_phone: '0983144424',
      owner_email: 'jaime@example.com',
      current_mileage: 25000,
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-02-15T00:00:00Z',
      maintenance_records: [
        { id: 'm3', service_date: '2026-04-10T10:00:00Z' },
      ],
    },
    {
      id: 'v3',
      tenant_id: 't1',
      plate: 'GS-5000',
      brand: 'Kia',
      model: 'Sportage',
      year: 2020,
      owner_name: 'Carlos Mendoza',
      owner_identification: '0912345678',
      owner_phone: '0991112233',
      owner_email: 'carlos@mendoza.ec',
      current_mileage: 48000,
      created_at: '2026-01-20T00:00:00Z',
      updated_at: '2026-01-20T00:00:00Z',
      maintenance_records: [],
    },
    {
      id: 'v4',
      tenant_id: 't1',
      plate: 'ABC-9999',
      brand: 'Hyundai',
      model: 'Tucson',
      year: 2019,
      owner_name: 'Transportes Rápidos S.A.',
      owner_identification: undefined,
      owner_phone: '0970001122',
      owner_email: 'logistica@rapidos.ec',
      current_mileage: 110000,
      created_at: '2026-01-05T00:00:00Z',
      updated_at: '2026-01-05T00:00:00Z',
      maintenance_records: [
        { id: 'm4', service_date: '2026-02-10T10:00:00Z' },
      ],
    },
  ];

  describe('aggregateWorkshopClients', () => {
    it('aggregates multi-vehicle fleet under the same identification', () => {
      const clients = aggregateWorkshopClients(sampleVehicles);
      expect(clients).toHaveLength(3);

      const jaime = clients.find((c) => c.identification === '1719623512');
      expect(jaime).toBeDefined();
      expect(jaime?.vehicles).toHaveLength(2);
      expect(jaime?.vehicles.map((v) => v.plate)).toEqual(['PBA-1001', 'PBA-1002']);
      expect(jaime?.totalServices).toBe(3);
      expect(jaime?.lastServiceDate).toBe('2026-04-10T10:00:00Z');
      expect(jaime?.isFleetOwner).toBe(true);
    });

    it('falls back to grouping by name when identification is missing', () => {
      const clients = aggregateWorkshopClients(sampleVehicles);
      const transportes = clients.find((c) => c.name === 'Transportes Rápidos S.A.');
      expect(transportes).toBeDefined();
      expect(transportes?.identification).toBeUndefined();
      expect(transportes?.vehicles).toHaveLength(1);
      expect(transportes?.totalServices).toBe(1);
      expect(transportes?.isFleetOwner).toBe(false);
    });

    it('handles vehicles with zero maintenance records gracefully', () => {
      const clients = aggregateWorkshopClients(sampleVehicles);
      const carlos = clients.find((c) => c.identification === '0912345678');
      expect(carlos).toBeDefined();
      expect(carlos?.totalServices).toBe(0);
      expect(carlos?.lastServiceDate).toBeNull();
    });
  });

  describe('computeClientKPIs', () => {
    it('computes accurate workshop fleet KPI totals', () => {
      const clients = aggregateWorkshopClients(sampleVehicles);
      const kpis = computeClientKPIs(clients, sampleVehicles.length);

      expect(kpis.totalClients).toBe(3);
      expect(kpis.fleetClientsCount).toBe(1); // Only Jaime has 2 vehicles
      expect(kpis.totalVehicles).toBe(4);
      expect(kpis.totalServices).toBe(4); // 2 + 1 + 0 + 1
    });
  });

  describe('filterWorkshopClients', () => {
    it('filters by client name', () => {
      const clients = aggregateWorkshopClients(sampleVehicles);
      const filtered = filterWorkshopClients(clients, 'mendoza');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Carlos Mendoza');
    });

    it('filters by cédula/RUC', () => {
      const clients = aggregateWorkshopClients(sampleVehicles);
      const filtered = filterWorkshopClients(clients, '1719623512');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].identification).toBe('1719623512');
    });

    it('filters by phone number', () => {
      const clients = aggregateWorkshopClients(sampleVehicles);
      const filtered = filterWorkshopClients(clients, '099111');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].phone).toBe('0991112233');
    });

    it('filters by vehicle plate owned by the client', () => {
      const clients = aggregateWorkshopClients(sampleVehicles);
      const filtered = filterWorkshopClients(clients, 'PBA-1002');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].identification).toBe('1719623512');
    });

    it('returns all clients when query is blank', () => {
      const clients = aggregateWorkshopClients(sampleVehicles);
      const filtered = filterWorkshopClients(clients, '   ');
      expect(filtered).toHaveLength(3);
    });
  });
});
