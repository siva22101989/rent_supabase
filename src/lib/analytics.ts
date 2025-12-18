import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from './queries';

export interface RevenueMetrics {
    totalRevenue: number;
    rentRevenue: number;
    hamaliRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
}

export interface MonthlyRevenue {
    month: string;
    rent: number;
    hamali: number;
    total: number;
}

export interface CustomerRevenue {
    customerId: string;
    customerName: string;
    totalRevenue: number;
    rentRevenue: number;
    hamaliRevenue: number;
    amountPaid: number;
    outstanding: number;
}

export interface AgingAnalysis {
    range: string;
    count: number;
    amount: number;
}

/**
 * Get overall revenue metrics
 */
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) {
        return {
            totalRevenue: 0,
            rentRevenue: 0,
            hamaliRevenue: 0,
            totalPaid: 0,
            totalOutstanding: 0
        };
    }

    // Get all storage records with payments
    const { data: records } = await supabase
        .from('storage_records')
        .select('hamali_payable, total_rent_billed, payments(amount)')
        .eq('warehouse_id', warehouseId);

    if (!records) return {
        totalRevenue: 0,
        rentRevenue: 0,
        hamaliRevenue: 0,
        totalPaid: 0,
        totalOutstanding: 0
    };

    let rentRevenue = 0;
    let hamaliRevenue = 0;
    let totalPaid = 0;

    records.forEach((r: any) => {
        rentRevenue += r.total_rent_billed || 0;
        hamaliRevenue += r.hamali_payable || 0;
        
        const payments = r.payments || [];
        totalPaid += payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    });

    const totalRevenue = rentRevenue + hamaliRevenue;
    const totalOutstanding = totalRevenue - totalPaid;

    return {
        totalRevenue,
        rentRevenue,
        hamaliRevenue,
        totalPaid,
        totalOutstanding
    };
}

/**
 * Get monthly revenue trends for the last 12 months
 */
export async function getMonthlyRevenueTrends(): Promise<MonthlyRevenue[]> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) return [];

    // Get records from last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: records } = await supabase
        .from('storage_records')
        .select('storage_start_date, hamali_payable, total_rent_billed')
        .eq('warehouse_id', warehouseId)
        .gte('storage_start_date', twelveMonthsAgo.toISOString());

    if (!records) return [];

    // Group by month
    const monthlyData = new Map<string, { rent: number; hamali: number }>();

    records.forEach((r: any) => {
        const date = new Date(r.storage_start_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existing = monthlyData.get(monthKey) || { rent: 0, hamali: 0 };
        existing.rent += r.total_rent_billed || 0;
        existing.hamali += r.hamali_payable || 0;
        monthlyData.set(monthKey, existing);
    });

    // Convert to array and sort
    const result: MonthlyRevenue[] = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
            month,
            rent: data.rent,
            hamali: data.hamali,
            total: data.rent + data.hamali
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    return result;
}

/**
 * Get top customers by revenue
 */
export async function getTopCustomersByRevenue(limit: number = 10): Promise<CustomerRevenue[]> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) return [];

    const { data: records } = await supabase
        .from('storage_records')
        .select(`
            customer_id,
            hamali_payable,
            total_rent_billed,
            customers(name),
            payments(amount)
        `)
        .eq('warehouse_id', warehouseId);

    if (!records) return [];

    // Group by customer
    const customerMap = new Map<string, CustomerRevenue>();

    records.forEach((r: any) => {
        const customerId = r.customer_id;
        const customerName = r.customers?.name || 'Unknown';
        
        const existing = customerMap.get(customerId) || {
            customerId,
            customerName,
            totalRevenue: 0,
            rentRevenue: 0,
            hamaliRevenue: 0,
            amountPaid: 0,
            outstanding: 0
        };

        existing.rentRevenue += r.total_rent_billed || 0;
        existing.hamaliRevenue += r.hamali_payable || 0;
        
        const payments = r.payments || [];
        existing.amountPaid += payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        customerMap.set(customerId, existing);
    });

    // Calculate totals and outstanding
    const customers = Array.from(customerMap.values()).map(c => ({
        ...c,
        totalRevenue: c.rentRevenue + c.hamaliRevenue,
        outstanding: (c.rentRevenue + c.hamaliRevenue) - c.amountPaid
    }));

    // Sort by total revenue and limit
    return customers
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);
}

/**
 * Get aging analysis of outstanding dues
 */
export async function getAgingAnalysis(): Promise<AgingAnalysis[]> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) return [];

    const { data: records } = await supabase
        .from('storage_records')
        .select('storage_start_date, hamali_payable, total_rent_billed, payments(amount)')
        .eq('warehouse_id', warehouseId);

    if (!records) return [];

    const now = new Date();
    const aging = {
        '0-30': { count: 0, amount: 0 },
        '30-60': { count: 0, amount: 0 },
        '60-90': { count: 0, amount: 0 },
        '90+': { count: 0, amount: 0 }
    };

    records.forEach((r: any) => {
        const totalBilled = (r.hamali_payable || 0) + (r.total_rent_billed || 0);
        const payments = r.payments || [];
        const amountPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const outstanding = totalBilled - amountPaid;

        if (outstanding <= 0) return; // Skip paid records

        const startDate = new Date(r.storage_start_date);
        const daysOld = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysOld <= 30) {
            aging['0-30'].count++;
            aging['0-30'].amount += outstanding;
        } else if (daysOld <= 60) {
            aging['30-60'].count++;
            aging['30-60'].amount += outstanding;
        } else if (daysOld <= 90) {
            aging['60-90'].count++;
            aging['60-90'].amount += outstanding;
        } else {
            aging['90+'].count++;
            aging['90+'].amount += outstanding;
        }
    });

    return [
        { range: '0-30 days', count: aging['0-30'].count, amount: aging['0-30'].amount },
        { range: '30-60 days', count: aging['30-60'].count, amount: aging['30-60'].amount },
        { range: '60-90 days', count: aging['60-90'].count, amount: aging['60-90'].amount },
        { range: '90+ days', count: aging['90+'].count, amount: aging['90+'].amount }
    ];
}

/**
 * Get collection efficiency metrics
 */
export async function getCollectionMetrics() {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) return {
        collectionRate: 0,
        averageDaysToPayment: 0,
        totalCollected: 0,
        totalBilled: 0
    };

    const { data: records } = await supabase
        .from('storage_records')
        .select('storage_start_date, hamali_payable, total_rent_billed, payments(amount, payment_date)')
        .eq('warehouse_id', warehouseId);

    if (!records) return {
        collectionRate: 0,
        averageDaysToPayment: 0,
        totalCollected: 0,
        totalBilled: 0
    };

    let totalBilled = 0;
    let totalCollected = 0;
    let totalDays = 0;
    let paymentCount = 0;

    records.forEach((r: any) => {
        const billed = (r.hamali_payable || 0) + (r.total_rent_billed || 0);
        totalBilled += billed;

        const payments = r.payments || [];
        payments.forEach((p: any) => {
            totalCollected += p.amount || 0;
            
            // Calculate days to payment
            const startDate = new Date(r.storage_start_date);
            const paymentDate = new Date(p.payment_date);
            const days = Math.floor((paymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (days >= 0) {
                totalDays += days;
                paymentCount++;
            }
        });
    });

    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
    const averageDaysToPayment = paymentCount > 0 ? totalDays / paymentCount : 0;

    return {
        collectionRate,
        averageDaysToPayment,
        totalCollected,
        totalBilled
    };
}
