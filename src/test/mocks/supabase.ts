import { vi } from 'vitest';

/**
 * Mock Supabase Client for Integration Tests
 * 
 * This provides a simplified mock of the Supabase client that can be used
 * in integration tests without requiring a real database connection.
 */

export function createMockSupabaseClient() {
  const mockData: Record<string, any[]> = {
    warehouses: [],
    customers: [],
    storage_records: [],
    payments: [],
    withdrawal_transactions: [],
    expenses: []
  };

  const createQueryBuilder = (table: string) => {
    let filters: any = {};
    const builder = {
      select: (_fields = '*') => {
        return builder;
      },
      insert: (data: any) => {
        const record = Array.isArray(data) ? data : [data];
        record.forEach(r => {
          const id = r.id || `mock-${Date.now()}-${Math.random()}`;
          if (!mockData[table]) mockData[table] = [];
          mockData[table]!.push({ ...r, id });
        });
        return builder;
      },
      update: (data: any) => {
        mockData[table] = (mockData[table] || []).map(record => {
          const matches = Object.entries(filters).every(([key, value]) => record[key] === value);
          return matches ? { ...record, ...data } : record;
        });
        return builder;
      },
      delete: () => {
        mockData[table] = (mockData[table] || []).filter(record => {
          return !Object.entries(filters).every(([key, value]) => record[key] === value);
        });
        return builder;
      },
      eq: (column: string, value: any) => {
        filters[column] = value;
        return builder;
      },
      in: (column: string, values: any[]) => {
        filters[`${column}_in`] = values;
        return builder;
      },
      gte: (column: string, value: any) => {
        filters[`${column}_gte`] = value;
        return builder;
      },
      lte: (column: string, value: any) => {
        filters[`${column}_lte`] = value;
        return builder;
      },
      is: (column: string, value: any) => {
        filters[`${column}_is`] = value;
        return builder;
      },
      order: (_column: string, _options?: any) => {
        return builder;
      },
      single: () => {
        const results = (mockData[table] || []).filter(record => {
          return Object.entries(filters).every(([key, value]) => {
            if (key.endsWith('_in')) {
              const col = key.replace('_in', '');
              return (value as any[]).includes(record[col]);
            }
            return record[key] === value;
          });
        });
        return { data: results[0] || null, error: null };
      },
      then: (resolve: any) => {
        const results = (mockData[table] || []).filter(record => {
          return Object.entries(filters).every(([key, value]) => {
            if (key.endsWith('_in')) {
              const col = key.replace('_in', '');
              return (value as any[]).includes(record[col]);
            }
            if (key.endsWith('_is')) {
              const col = key.replace('_is', '');
              return record[col] === value;
            }
            return record[key] === value;
          });
        });
        return resolve({ data: results, error: null });
      }
    };

    return builder;
  };

  return {
    from: (table: string) => createQueryBuilder(table),
    rpc: (_functionName: string, _params: any) => {
      // Mock RPC calls
      return Promise.resolve({ data: { success: true }, error: null });
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'mock-user-id' } }, error: null })
    },
    // Helper to reset mock data between tests
    __resetMockData: () => {
      Object.keys(mockData).forEach(key => {
        mockData[key] = [];
      });
    },
    // Helper to seed mock data
    __seedMockData: (table: string, data: any[]) => {
      mockData[table] = [...data];
    }
  };
}

/**
 * Mock createClient function for tests
 */
export const createClient = vi.fn(() => createMockSupabaseClient());
