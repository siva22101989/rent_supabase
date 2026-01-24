import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from '@/lib/data';
import { startOfYear, endOfYear, format, getMonth } from 'date-fns';

export class AnalyticsService {
    static async getMonthlyFinancials(year: number) {
        const supabase = await createClient();
        const warehouseId = await getUserWarehouse();
        if (!warehouseId) return [];

        const startDate = startOfYear(new Date(year, 0, 1)).toISOString();
        const endDate = endOfYear(new Date(year, 0, 1)).toISOString();

        // 1. Fetch Payments (Revenue)
        // Linking via storage_records to filter by warehouse
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, payment_date, storage_records!inner(warehouse_id)')
            .eq('storage_records.warehouse_id', warehouseId)
            .gte('payment_date', startDate)
            .lte('payment_date', endDate);
            
        // 2. Fetch Expenses
        const { data: expenses } = await supabase
            .from('expenses')
            .select('amount, expense_date')
            .eq('warehouse_id', warehouseId)
            .gte('expense_date', startDate)
            .lte('expense_date', endDate);

        // Aggregate
        const monthlyData = new Array(12).fill(0).map((_, i) => ({
            name: format(new Date(year, i, 1), 'MMM'),
            revenue: 0,
            expense: 0,
            profit: 0
        }));

        payments?.forEach((p: any) => {
            const month = getMonth(new Date(p.payment_date));
            const target = monthlyData[month];
            if (target) {
                target.revenue += p.amount;
            }
        });

        expenses?.forEach((e: any) => {
            const month = getMonth(new Date(e.expense_date));
            const target = monthlyData[month];
            if (target) {
                target.expense += e.amount;
            }
        });

        monthlyData.forEach(m => {
            m.profit = m.revenue - m.expense;
        });

        return monthlyData;
    }

    static async getStockTrends(year: number) {
        const supabase = await createClient();
        const warehouseId = await getUserWarehouse();
        if (!warehouseId) return [];

        const startDate = startOfYear(new Date(year, 0, 1)).toISOString();
        const endDate = endOfYear(new Date(year, 0, 1)).toISOString();

        // Inflow: Storage Records created
        const { data: inflows } = await supabase
            .from('storage_records')
            .select('bags_in, storage_start_date')
            .eq('warehouse_id', warehouseId)
            .gte('storage_start_date', startDate)
            .lte('storage_start_date', endDate);

        // Outflow: Withdrawal Transactions
        const { data: outflows } = await supabase
            .from('withdrawal_transactions')
            .select('bags_withdrawn, withdrawal_date')
            .eq('warehouse_id', warehouseId)
            .gte('withdrawal_date', startDate)
            .lte('withdrawal_date', endDate);

        const monthlyData = new Array(12).fill(0).map((_, i) => ({
            name: format(new Date(year, i, 1), 'MMM'),
            inflow: 0,
            outflow: 0
        }));

        inflows?.forEach((r: any) => {
            const month = getMonth(new Date(r.storage_start_date));
            const target = monthlyData[month];
            if (target) target.inflow += (r.bags_in || 0);
        });

        outflows?.forEach((t: any) => {
            const month = getMonth(new Date(t.withdrawal_date));
            const target = monthlyData[month];
            if (target) target.outflow += (t.bags_withdrawn || 0);
        });

        return monthlyData;
    }

    static async getYearlyComparison(startYear: number, endYear: number) {
        const supabase = await createClient();
        const warehouseId = await getUserWarehouse();
        if (!warehouseId) return [];

        const startDate = startOfYear(new Date(startYear, 0, 1)).toISOString();
        const endDate = endOfYear(new Date(endYear, 0, 1)).toISOString();

        // Fetch Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, payment_date, storage_records!inner(warehouse_id)')
            .eq('storage_records.warehouse_id', warehouseId)
            .gte('payment_date', startDate)
            .lte('payment_date', endDate);

        const yearlyData: Record<number, number> = {};
        // Initialize
        for (let y = startYear; y <= endYear; y++) {
            yearlyData[y] = 0;
        }

        payments?.forEach((p: any) => {
            const y = new Date(p.payment_date).getFullYear();
            if (yearlyData[y] !== undefined) {
                yearlyData[y] += p.amount;
            }
        });

        return Object.entries(yearlyData).map(([year, revenue]) => ({
            year,
            revenue
        }));
    }
}
