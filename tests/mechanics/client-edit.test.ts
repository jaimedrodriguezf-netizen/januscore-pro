import { describe, expect, it, vi } from 'vitest';
import {
  validateClientUpdate,
  updateWorkshopClient,
} from '@/lib/mechanics/client-edit';

describe('Workshop Client Edit Domain Service (TDD)', () => {
  describe('validateClientUpdate', () => {
    it('rejects updates with empty or blank name', () => {
      const result = validateClientUpdate({
        name: '   ',
        identification: '1719623512',
        phone: '0983144424',
        email: 'test@example.com',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/nombre.*requerido/i);
    });

    it('sanitizes and normalizes valid client input', () => {
      const result = validateClientUpdate({
        name: '  Juan Carlos Pérez  ',
        identification: ' 171962351-2 ',
        phone: ' 099 123 4567 ',
        email: ' Juan@Example.com ',
      });

      expect(result.valid).toBe(true);
      expect(result.data?.name).toBe('Juan Carlos Pérez');
      expect(result.data?.identification).toBe('1719623512');
      expect(result.data?.phone).toBe('0991234567');
      expect(result.data?.email).toBe('juan@example.com');
    });

    it('allows empty optional fields and sets them to null', () => {
      const result = validateClientUpdate({
        name: 'Maria Gomez',
        identification: '   ',
        phone: '',
        email: '',
      });

      expect(result.valid).toBe(true);
      expect(result.data?.name).toBe('Maria Gomez');
      expect(result.data?.identification).toBeNull();
      expect(result.data?.phone).toBeNull();
      expect(result.data?.email).toBeNull();
    });
  });

  describe('updateWorkshopClient', () => {
    it('updates vehicles matching original identification in tenant', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null, count: 2 });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      const mockSupabase = {
        from: mockFrom,
      };

      const result = await updateWorkshopClient(mockSupabase as any, {
        tenantId: 'tenant-123',
        originalIdentification: '1719623512',
        name: 'Jaime D. Rodriguez',
        identification: '1719623512',
        phone: '0983144424',
        email: 'jaime@januscore.pro',
      });

      expect(result.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('vehicles');
      expect(mockUpdate).toHaveBeenCalledWith(
        {
          owner_name: 'Jaime D. Rodriguez',
          owner_identification: '1719623512',
          owner_phone: '0983144424',
          owner_email: 'jaime@januscore.pro',
        },
        { count: 'exact' }
      );
      expect(mockEq1).toHaveBeenCalledWith('tenant_id', 'tenant-123');
      expect(mockEq2).toHaveBeenCalledWith('owner_identification', '1719623512');
    });

    it('falls back to updating by originalName when originalIdentification is absent', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null, count: 1 });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      const mockSupabase = {
        from: mockFrom,
      };

      const result = await updateWorkshopClient(mockSupabase as any, {
        tenantId: 'tenant-123',
        originalName: 'Carlos Mendoza',
        name: 'Carlos Mendoza Ramos',
        identification: '0912345678',
        phone: '0991112233',
        email: 'carlos@mendoza.ec',
      });

      expect(result.success).toBe(true);
      expect(mockEq2).toHaveBeenCalledWith('owner_name', 'Carlos Mendoza');
    });

    it('returns error when database operation fails', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'Database connection failed' } });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      const mockSupabase = {
        from: mockFrom,
      };

      const result = await updateWorkshopClient(mockSupabase as any, {
        tenantId: 'tenant-123',
        originalIdentification: '1719623512',
        name: 'Jaime Rodriguez',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });
});
