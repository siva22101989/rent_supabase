'use server';

import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from '@/lib/queries';

export async function fetchReportData(
  reportType: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) {
    throw new Error('Unauthorized');
  }

  // 1. All Customers Report
  if (reportType === 'all-customers') {
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('name');
      
    // Fetch active stats for each customer
    const { data: activeRecords } = await supabase
      .from('storage_records')
      .select('customer_id, bags_stored, total_rent_billed, hamali_payable')
      .eq('warehouse_id', warehouseId)
      .is('storage_end_date', null);
    
    return { 
      type: 'all-customers', 
      data: customers, 
      stats: activeRecords 
    };
  }

  // 2. Active Inventory Report
  if (reportType === 'active-inventory') {
    const { data: records } = await supabase
      .from('storage_records')
      .select(`
        *,
        customers (name)
      `)
      .eq('warehouse_id', warehouseId)
      .is('storage_end_date', null)
      .order('storage_start_date');
      
    return {
      type: 'active-inventory',
      data: records
    };
  }

  // 3. Inflow Register (Filtered by Start Date)
  if (reportType === 'inflow-register') {
    let query = supabase
      .from('storage_records')
      .select(`
        *,
        customers (name)
      `)
      .eq('warehouse_id', warehouseId)
      .order('storage_start_date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('storage_start_date', filters.startDate);
    }
    if (filters?.endDate) {
      // Add one day to end date to make it inclusive/cover full day if time is involved
      // or just use straight comparison if dates are purely YYYY-MM-DD
      const nextDay = new Date(filters.endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('storage_start_date', nextDay.toISOString());
    }

    const { data: records } = await query;
    return {
      type: 'inflow-register',
      data: records,
      period: filters
    };
  }

  // 4. Outflow Register (Filtered by End Date)
  if (reportType === 'outflow-register') {
    let query = supabase
      .from('storage_records')
      .select(`
        *,
        customers (name)
      `)
      .eq('warehouse_id', warehouseId)
      .not('storage_end_date', 'is', null) // Only completed/outflow records
      .order('storage_end_date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('storage_end_date', filters.startDate);
    }
    if (filters?.endDate) {
      const nextDay = new Date(filters.endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('storage_end_date', nextDay.toISOString());
    }

    const { data: records } = await query;
    return {
      type: 'outflow-register',
      data: records,
      period: filters
    };
  }

  // 5. Payment Register (Filtered by Payment Date)
  if (reportType === 'payment-register') {
    let query = supabase
      .from('payments')
      .select(`
        *,
        storage_records (
          record_number,
          id,
          commodity_description
        ),
        customers (name)
      `)
      .eq('warehouse_id', warehouseId)
      .order('payment_date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('payment_date', filters.startDate);
    }
    if (filters?.endDate) {
      const nextDay = new Date(filters.endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('payment_date', nextDay.toISOString());
    }

    const { data: payments } = await query;
    return {
      type: 'payment-register',
      data: payments,
      period: filters
    };
  }

  // 6. Pending Dues List
  if (reportType === 'pending-dues') {
    // This requires calculating totals. A bit complex in one query.
    // Strategy: Fetch all customers, and all records with outstanding dues.
    
    // 1. Fetch Customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, phone, village')
      .eq('warehouse_id', warehouseId)
      .order('name');
      
    if (!customers) return { type: 'pending-dues', data: [] };

    // 2. Fetch all records (simplified: active ones + ones with partial payments?)
    // Actually, simple "Pending Dues" usually means balance > 0.
    // Fetch records where balance > 0 isn't direct column.
    // We need to fetch all records, or at least active ones and ones where paid < billed.
    // For simplicity/performance, let's fetch active records (dues accumulate) 
    // and inactive records where we might want to track checking...
    // Let's stick to "Active Records" for now as the main source of current dues.
    // OR better: Fetch *all* records for these customers and compute.
    // BUT fetching ALL records is heavy.
    // Compromise: Fetch ACTIVE records + Records closed in last 3 months?
    // Let's just fetch ACTIVE records for now as that's 90% of "Dues". Closed records usually settled.
    
    const { data: records } = await supabase
      .from('storage_records')
      .select(`
        *,
        payments (amount)
      `)
      .eq('warehouse_id', warehouseId); 
      // Ideally we filter where total_rent + hamali > total_paid
    
    // Filter in memory for precise calculation
    const reportData = customers.map(c => {
       const userRecords = records?.filter((r: any) => r.customer_id === c.id) || [];
       let totalDues = 0;
       let totalPaid = 0;
       
       userRecords.forEach((r: any) => {
         const billed = (r.total_rent_billed || 0) + (r.hamali_payable || 0);
         const paid = (r.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
         totalDues += billed;
         totalPaid += paid;
       });
       
       return {
         ...c,
         totalDues,
         totalPaid,
         balance: totalDues - totalPaid
       };
    }).filter(c => c.balance > 1); // Only showing > 1 to avoid rounding noise

    return {
      type: 'pending-dues',
      data: reportData
    };
  }

  // 7. Transaction History (Fallback / Last 1000)
  if (reportType === 'transaction-history') {
    const { data: records } = await supabase
      .from('storage_records')
      .select(`
        *,
        customers (name)
      `)
      .eq('warehouse_id', warehouseId)
      .order('storage_start_date', { ascending: false })
      .limit(1000); // Limit for safety
      
    return {
      type: 'transaction-history',
      data: records
    };
  }
  
  return null;
}
