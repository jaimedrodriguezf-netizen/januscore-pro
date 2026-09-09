import { describe, expect, it, vi } from 'vitest';
import {
  lookupVehicleByPlate,
  lookupClientByIdentification,
} from '@/lib/mechanics/client-lookup';

describe('Mechanics Client & Vehicle Lookup Service (TDD)', () => {
  describe('lookupVehicleByPlate', () => {
    it('returns found: false when plate is empty or blank', async () => {
      const mockSupabase = {
        from: vi.fn(),
      };
      const result = await lookupVehicleByPlate(mockSupabase as any, 'tenant-1', '   ');
      expect(result.found).toBe(false);
      expect(result.vehicle).toBeNull();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('formats plate and finds existing vehicle in tenant', async () => {
      const mockVehicle = {
        id: 'veh-1',
        tenant_id: 'tenant-1',
        plate: 'PBA-1234',
        brand: 'Chevrolet',
        model: 'D-Max',
        owner_name: 'Juan Perez',
        owner_identification: '1719623512',
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockVehicle, error: null }),
              }),
            }),
          }),
        }),
      };

      const result = await lookupVehicleByPlate(mockSupabase as any, 'tenant-1', 'pba1234');
      expect(result.found).toBe(true);
      expect(result.vehicle?.plate).toBe('PBA-1234');
      expect(result.vehicle?.owner_name).toBe('Juan Perez');
      expect(mockSupabase.from).toHaveBeenCalledWith('vehicles');
    });

    it('returns found: false when vehicle is not in tenant', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      };

      const result = await lookupVehicleByPlate(mockSupabase as any, 'tenant-1', 'XYZ-9999');
      expect(result.found).toBe(false);
      expect(result.vehicle).toBeNull();
    });
  });

  describe('lookupClientByIdentification', () => {
    it('returns found: false when identification length is invalid', async () => {
      const mockSupabase = { from: vi.fn() };
      const result = await lookupClientByIdentification(mockSupabase as any, 'tenant-1', '123');
      expect(result.found).toBe(false);
      expect(result.client).toBeNull();
    });

    it('returns local client and associated vehicles when found in tenant', async () => {
      const mockVehicles = [
        {
          id: 'v-1',
          plate: 'GS-100',
          brand: 'Toyota',
          model: 'Hilux',
          owner_name: 'Carlos Vera',
          owner_phone: '0991234567',
          owner_email: 'carlos@example.com',
          owner_identification: '1719623512',
        },
        {
          id: 'v-2',
          plate: 'GS-200',
          brand: 'Kia',
          model: 'Sportage',
          owner_name: 'Carlos Vera',
          owner_phone: '0991234567',
          owner_email: 'carlos@example.com',
          owner_identification: '1719623512',
        },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockVehicles, error: null }),
              }),
            }),
          }),
        }),
      };

      const result = await lookupClientByIdentification(
        mockSupabase as any,
        'tenant-1',
        '171962351-2'
      );

      expect(result.found).toBe(true);
      expect(result.source).toBe('local');
      expect(result.client?.name).toBe('Carlos Vera');
      expect(result.client?.phone).toBe('0991234567');
      expect(result.client?.identification).toBe('1719623512');
      expect(result.vehicles).toHaveLength(2);
    });

    it('falls back to SRI lookup when not found locally and lookupSri is enabled', async () => {
      // Mock empty local lookup
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      };

      const mockSriFn = vi.fn().mockResolvedValue({
        tax_id: '1719623512',
        type: 'cedula',
        name: 'RODRIGUEZ FLORES JAIME DANIEL',
      });

      const result = await lookupClientByIdentification(
        mockSupabase as any,
        'tenant-1',
        '1719623512',
        {
          lookupSri: true,
          sriLookupFn: mockSriFn,
        }
      );

      expect(result.found).toBe(true);
      expect(result.source).toBe('sri');
      expect(result.client?.name).toBe('RODRIGUEZ FLORES JAIME DANIEL');
      expect(result.client?.identification).toBe('1719623512');
      expect(mockSriFn).toHaveBeenCalledWith('1719623512', undefined);
    });
  });
});
