import { createClient } from '@/utils/supabase/server';
import type { Expense } from '@/lib/definitions';
import { logError } from '@/lib/error-logger';
import { getUserWarehouse } from './warehouses';

export async function getFinancialStats() {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return { totalIncome: 0, totalExpenses: 0, totalBalance: 0 };

    const { data: payments } = await supabase
        .from('payments')
        .select(`
            amount,
            storage_record:storage_records!inner(warehouse_id)
        `)
        .eq('storage_record.warehouse_id', warehouseId);

    const totalIncome = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('warehouse_id', warehouseId);

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
        totalIncome,
        totalExpenses,
        totalBalance: totalIncome - totalExpenses
    };
}

export async function getExpenses(limit = 50): Promise<Expense[]> {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .order('expense_date', { ascending: false })
    .limit(limit);

  if (error) {
    logError(error, { operation: 'fetch_expenses', warehouseId });
    return [];
  }

  return data.map((e: any) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    date: new Date(e.expense_date),
    category: e.category,
  }));
}
