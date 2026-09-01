import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { matchBeneficiary } from '@/lib/review/beneficiary';
import {
  listBeneficiaries,
  getActiveBeneficiaryAccounts,
  addBeneficiary,
  updateBeneficiary,
  toggleBeneficiaryStatus,
  deleteBeneficiary,
  BeneficiaryConfig,
} from '@/lib/admin/beneficiaries';

describe('Admin Beneficiary Accounts Management (R15)', () => {
  function createMockSupabase(initialRows: BeneficiaryConfig[] = []) {
    let rows = [...initialRows];

    const client = {
      from: vi.fn((table: string) => {
        if (table === 'beneficiary_configs') {
          return {
            select: vi.fn((cols?: string) => ({
              eq: vi.fn((col1: string, val1: unknown) => {
                const chain2 = {
                  order: vi.fn((_ordCol: string, _ordOpts: unknown) => {
                    const filtered = rows.filter((r) => (r as any)[col1] === val1);
                    return Promise.resolve({ data: filtered, error: null });
                  }),
                  eq: vi.fn((col2: string, val2: unknown) => {
                    const filtered = rows.filter(
                      (r) => (r as any)[col1] === val1 && (r as any)[col2] === val2,
                    );
                    return Promise.resolve({
                      data: cols === 'account_number'
                        ? filtered.map((f) => ({ account_number: f.account_number }))
                        : filtered,
                      error: null,
                    });
                  }),
                };
                return chain2;
              }),
            })),
            insert: vi.fn((payload: Record<string, unknown>) => {
              const newRow: BeneficiaryConfig = {
                id: `ben-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                tenant_id: payload.tenant_id as string,
                bank: payload.bank as string,
                account_number: payload.account_number as string,
                account_holder: payload.account_holder as string,
                is_active: payload.is_active as boolean ?? true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              rows.push(newRow);
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: newRow, error: null }),
              };
            }),
            update: vi.fn((patch: Record<string, unknown>) => ({
              eq: vi.fn((col: string, val: unknown) => {
                const target = rows.find((r) => (r as any)[col] === val);
                if (target) Object.assign(target, patch);
                return {
                  select: vi.fn().mockReturnThis(),
                  single: vi.fn().mockResolvedValue({ data: target ?? null, error: null }),
                };
              }),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn((col: string, val: unknown) => {
                rows = rows.filter((r) => (r as any)[col] !== val);
                return Promise.resolve({ error: null });
              }),
            })),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    return { client, getRows: () => rows };
  }

  it('adds beneficiary account with valid required fields (R15)', async () => {
    const { client } = createMockSupabase();

    // Validation for missing fields
    await expect(
      addBeneficiary(client, {
        tenantId: '',
        bank: 'Pichincha',
        accountNumber: '2200112233',
        accountHolder: 'Empresa SA',
      }),
    ).rejects.toThrow(/Tenant ID is required/);

    await expect(
      addBeneficiary(client, {
        tenantId: 'tenant-1',
        bank: '',
        accountNumber: '2200112233',
        accountHolder: 'Empresa SA',
      }),
    ).rejects.toThrow(/Bank name is required/);

    const created = await addBeneficiary(client, {
      tenantId: 'tenant-1',
      bank: 'Pichincha',
      accountNumber: '2200112233',
      accountHolder: 'Empresa SA',
    });

    expect(created.id).toBeDefined();
    expect(created.bank).toBe('Pichincha');
    expect(created.account_number).toBe('2200112233');
    expect(created.account_holder).toBe('Empresa SA');
    expect(created.is_active).toBe(true);
  });

  it('lists accounts and retrieves active accounts for review matching (R5, R15)', async () => {
    const { client } = createMockSupabase();
    await addBeneficiary(client, {
      tenantId: 'tenant-1',
      bank: 'Pichincha',
      accountNumber: '2200112233',
      accountHolder: 'Empresa Matriz',
    });
    const secondary = await addBeneficiary(client, {
      tenantId: 'tenant-1',
      bank: 'Produbanco',
      accountNumber: '1100445566',
      accountHolder: 'Empresa Sucursal',
    });

    const all = await listBeneficiaries(client, 'tenant-1');
    expect(all).toHaveLength(2);

    // Active accounts lookup returns both
    let activeAccounts = await getActiveBeneficiaryAccounts(client, 'tenant-1');
    expect(activeAccounts).toEqual(['2200112233', '1100445566']);

    // Match extracted account against active list
    const match1 = matchBeneficiary('2200112233', activeAccounts);
    expect(match1.isMatch).toBe(true);

    // Deactivate secondary account
    await toggleBeneficiaryStatus(client, secondary.id, false);

    // Active accounts lookup now excludes deactivated account
    activeAccounts = await getActiveBeneficiaryAccounts(client, 'tenant-1');
    expect(activeAccounts).toEqual(['2200112233']);

    // Matching deactivated account now returns isMatch=false
    const match2 = matchBeneficiary('1100445566', activeAccounts);
    expect(match2.isMatch).toBe(false);
  });

  it('updates and deletes beneficiary account records', async () => {
    const { client, getRows } = createMockSupabase();
    const created = await addBeneficiary(client, {
      tenantId: 'tenant-1',
      bank: 'Pichincha',
      accountNumber: '2200112233',
      accountHolder: 'Old Holder',
    });

    const updated = await updateBeneficiary(client, created.id, {
      accountHolder: 'New Holder Name',
    });
    expect(updated.account_holder).toBe('New Holder Name');

    await deleteBeneficiary(client, created.id);
    expect(getRows()).toHaveLength(0);
  });
});
