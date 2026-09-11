import { describe, it, expect, vi } from 'vitest';
import {
  formatWorkOrderNumber,
  parseWorkOrderNumber,
  peekNextWorkOrderNumber,
  getNextWorkOrderNumber,
} from '@/lib/mechanics/sequences';

describe('Work Order Sequence Generator (Strict TDD)', () => {
  describe('formatWorkOrderNumber', () => {
    it('formats numbers with standard 4-digit zero-padding and OT- prefix', () => {
      expect(formatWorkOrderNumber(1)).toBe('OT-0001');
      expect(formatWorkOrderNumber(9)).toBe('OT-0009');
      expect(formatWorkOrderNumber(10)).toBe('OT-0010');
      expect(formatWorkOrderNumber(999)).toBe('OT-0999');
      expect(formatWorkOrderNumber(1000)).toBe('OT-1000');
    });

    it('supports custom prefix and custom padding', () => {
      expect(formatWorkOrderNumber(5, 'ORD-', 5)).toBe('ORD-00005');
      expect(formatWorkOrderNumber(12345, 'OT-', 4)).toBe('OT-12345');
    });
  });

  describe('parseWorkOrderNumber', () => {
    it('extracts prefix and numerical sequence from formatted order numbers', () => {
      const parsed = parseWorkOrderNumber('OT-0042');
      expect(parsed).toEqual({ prefix: 'OT-', seq: 42 });
    });

    it('handles custom prefixes', () => {
      const parsed = parseWorkOrderNumber('ORD-00125');
      expect(parsed).toEqual({ prefix: 'ORD-', seq: 125 });
    });

    it('returns null for unformatted or non-numeric strings', () => {
      expect(parseWorkOrderNumber('MANUAL_ORDER')).toBeNull();
      expect(parseWorkOrderNumber('')).toBeNull();
    });
  });

  describe('peekNextWorkOrderNumber', () => {
    it('calls RPC peek_next_work_order_number and returns consecutive candidate', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: 'OT-0010', error: null }),
      };

      const result = await peekNextWorkOrderNumber(mockSupabase as any, 'tenant-123');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('peek_next_work_order_number', {
        p_tenant_id: 'tenant-123',
      });
      expect(result).toBe('OT-0010');
    });

    it('falls back to counting existing records if RPC fails or is unavailable', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'function not found' } }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        }),
      };

      const result = await peekNextWorkOrderNumber(mockSupabase as any, 'tenant-123');
      expect(result).toBe('OT-0006');
    });
  });

  describe('getNextWorkOrderNumber', () => {
    it('calls RPC get_next_work_order_number and returns allocated sequential number', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: 'OT-0010', error: null }),
      };

      const result = await getNextWorkOrderNumber(mockSupabase as any, 'tenant-123');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_next_work_order_number', {
        p_tenant_id: 'tenant-123',
      });
      expect(result).toBe('OT-0010');
    });

    it('falls back gracefully to counting existing records + 1 if RPC fails', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'function not found' } }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 8, error: null }),
          }),
        }),
      };

      const result = await getNextWorkOrderNumber(mockSupabase as any, 'tenant-123');
      expect(result).toBe('OT-0009');
    });
  });
});
