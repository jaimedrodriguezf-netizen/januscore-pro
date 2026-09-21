import { describe, it, expect, vi } from 'vitest';
import { updatePublicOdometer } from '@/lib/mechanics/service';

describe('Public Vehicle Odometer Update (Security & Integrity)', () => {
  it('rejects invalid inputs before making database calls', async () => {
    const mockSupabase = { rpc: vi.fn() } as any;

    const resEmpty = await updatePublicOdometer(mockSupabase, '', 50000);
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.error).toContain('inválidos');
    expect(mockSupabase.rpc).not.toHaveBeenCalled();

    const resZero = await updatePublicOdometer(mockSupabase, 'veh-123', 0);
    expect(resZero.success).toBe(false);
    expect(resZero.error).toContain('inválidos');
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('delegates to secure RPC and handles anti-rollback rejection', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          success: false,
          error: 'El kilometraje ingresado (45000 km) no puede ser menor al actual registrado (50000 km)',
        },
        error: null,
      }),
    } as any;

    const res = await updatePublicOdometer(mockSupabase, 'veh-123', 45000);
    expect(res.success).toBe(false);
    expect(res.error).toContain('no puede ser menor');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('update_public_vehicle_odometer', {
      p_vehicle_id: 'veh-123',
      p_mileage: 45000,
    });
  });

  it('succeeds when increasing odometer reading through secure RPC', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          success: true,
          vehicle_id: 'veh-123',
          previous_mileage: 50000,
          new_mileage: 55000,
        },
        error: null,
      }),
    } as any;

    const res = await updatePublicOdometer(mockSupabase, 'veh-123', 55000);
    expect(res.success).toBe(true);
    expect(res.newMileage).toBe(55000);
    expect(res.previousMileage).toBe(50000);
  });
});
