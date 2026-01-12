'use server';

import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from '@/lib/queries';
import { logError } from './error-logger';
import * as Sentry from "@sentry/nextjs";

  export async function fetchReportData(
    reportType: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      customerId?: string;
      includeHistory?: boolean;
      duesType?: 'all' | 'hamali';
    }
  ) {
    try {
      const supabase = await createClient();
      const warehouseId = await getUserWarehouse();
  
      // Dynamic import for billing utils to avoid circular dependency issues if any
      const { calculateFinalRent } = await import('@/lib/billing');
  
      if (!warehouseId) {
        throw new Error('Unauthorized');
      }
  
      // 0. Customer Dues Details (Single Customer)
      if (reportType === 'customer-dues-details') {
        if (!filters?.customerId) throw new Error("Customer ID required");

        const { data: customer } = await supabase.from('customers').select('*').eq('id', filters.customerId).single();
        if (!customer) throw new Error("Customer not found");
  
        // Fetch ALL records for customer
        const { data: records } = await supabase
          .from('storage_records')
          .select(`
              *,
              payments (amount, type, payment_date)
          `)
          .eq('customer_id', filters.customerId)
          .eq('warehouse_id', warehouseId)
          .is('deleted_at', null)
          .order('storage_start_date', { ascending: false });
  
        if (!records) return { type: 'customer-dues-details', data: [], customer };
  
        const processedRecords = records.map((record: any) => {
            // 1. Calculate Rent Due
            let rentDue = 0;
            let isprojected = false;
  
            // Filter: If Hamali Only, ignore Rent Logic entirely
            if (filters?.duesType !== 'hamali') {
                if (record.storage_end_date) {
                     // Closed Record: Trust the billed amount
                     rentDue = record.total_rent_billed || 0;
                } else {
                      // Active Record: Calculate accrued rent till NOW
                     const result = calculateFinalRent(
                         { 
                             ...record, 
                             storageStartDate: record.storage_start_date, 
                             storageEndDate: null 
                         },
                         new Date(), // Calculated till TODAY
                         record.bags_stored
                     );
                     // Use proper logic: If DB has a value (manual/migrated), use max to be safe.
                     rentDue = Math.max(record.total_rent_billed || 0, result.rent);
                     isprojected = true;
                }
            }
  
            // 2. Hamali Due
            const hamaliDue = record.hamali_payable || 0;
  
            // 3. Payments made against THIS record
            let rentPaid = 0;
            let hamaliPaid = 0;
            let otherPaid = 0;
  
            (record.payments || []).forEach((p: any) => {
                 if (p.type === 'rent') rentPaid += p.amount;
                 else if (p.type === 'hamali') hamaliPaid += p.amount;
                 else otherPaid += p.amount;
            });
  
            // Allocation of 'other' payments -> prioritize Hamali then Rent
            let remaining = otherPaid;
            if (remaining > 0) {
                const hamaliBalance = Math.max(0, hamaliDue - hamaliPaid);
                const take = Math.min(hamaliBalance, remaining);
                hamaliPaid += take;
                remaining -= take;
            }
            if (remaining > 0 && filters?.duesType !== 'hamali') {
                const rentBalance = Math.max(0, rentDue - rentPaid);
                const take = Math.min(remaining, rentBalance);
                rentPaid += take;
                remaining -= take;
            }
  
            // If Hamali Only, zero out Rent Paid if it was somehow tracked?
            // Actually, if we are hiding Rent, we should probably hide Rent payments too.
            // But strict 'Rent' payments shouldn't exist if we are looking at Hamali Only view? 
            // Better to just zero them for the display logic.
            if (filters?.duesType === 'hamali') {
                rentPaid = 0;
            }
  
            const rentBalance = Math.max(0, rentDue - rentPaid);
            const hamaliBalance = Math.max(0, hamaliDue - hamaliPaid);
            const totalBalance = rentBalance + hamaliBalance;
  
            return {
                recordId: record.id,
                recordNumber: record.record_number || record.id.substring(0, 8),
                date: record.storage_start_date,
                commodity: record.commodity_description,
                bags: record.bags_stored,
                status: record.storage_end_date ? 'Closed' : 'Active',
                rentDue: Math.round(rentDue),
                hamaliDue: Math.round(hamaliDue),
                rentPaid: Math.round(rentPaid),
                hamaliPaid: Math.round(hamaliPaid),
                rentBalance: Math.round(rentBalance),
                hamaliBalance: Math.round(hamaliBalance),
                totalBalance: Math.round(totalBalance),
                isProjected: isprojected
            };
        });
  
        // Sort: Active first, then by date desc
        processedRecords.sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
  
        // Filter based on includeHistory flag and balance check
        const finalData = processedRecords.filter(r => 
            filters.includeHistory || r.totalBalance > 0 || r.status === 'Active'
        );
  
        return {
            type: 'customer-dues-details',
            data: finalData,
            customer,
            duesType: filters.duesType // Pass it back for PDF renderer
        };
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
      .is('storage_end_date', null)
      .is('deleted_at', null);
    
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
      .is('deleted_at', null)
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
      .is('deleted_at', null)
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
      .is('deleted_at', null)
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
      .is('deleted_at', null)
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
      .eq('warehouse_id', warehouseId)
      .is('deleted_at', null); 
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

  // 6b. Rent Pending Breakdown (Detailed)
  if (reportType === 'rent-pending-breakdown') {
      // Similar to pending-dues but returns raw details per customer for table display
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone, village')
        .eq('warehouse_id', warehouseId)
        .order('name');
        
      if (!customers) return { type: 'rent-pending-breakdown', data: [] };
  
      const { data: records } = await supabase
        .from('storage_records')
        .select(`
          *,
          payments (amount, type)
        `)
        .eq('warehouse_id', warehouseId)
        .is('deleted_at', null);
      
      const reportData = customers.map(c => {
         const userRecords = records?.filter((r: any) => r.customer_id === c.id) || [];
         let rentBilled = 0;
         let hamaliBilled = 0;
         let rentPaid = 0;
         let hamaliPaid = 0;
         let otherPaid = 0; // Payments without type or 'other'
         
         userRecords.forEach((r: any) => {
           rentBilled += (r.total_rent_billed || 0);
           hamaliBilled += (r.hamali_payable || 0); // Assuming hamali_payable is numeric
           
           (r.payments || []).forEach((p: any) => {
               if (p.type === 'rent') rentPaid += p.amount;
               else if (p.type === 'hamali') hamaliPaid += p.amount;
               else otherPaid += p.amount;
           });
         });
         
         // Logic: 
         // Rent Pending = Rent Billed - Rent Paid.
         // Hamali Pending = Hamali Billed - Hamali Paid.
         // If payments are generic (no type), we assume they cover oldest dues or proportionally.
         // For simplicity: We will assign 'otherPaid' to Hamali first, then Rent. (or vice versa).
         // Let's assume generic payments cover Hamali first.
         
         let remainingOther = otherPaid;
         
         let hamaliPending = hamaliBilled - hamaliPaid;
         if (remainingOther > 0 && hamaliPending > 0) {
             const deduct = Math.min(remainingOther, hamaliPending);
             hamaliPending -= deduct;
             remainingOther -= deduct;
             hamaliPaid += deduct; // Effectively treated as Hamali payment
         }
         
         let rentPending = rentBilled - rentPaid;
         if (remainingOther > 0 && rentPending > 0) {
             const deduct = Math.min(remainingOther, rentPending);
             rentPending -= deduct;
             remainingOther -= deduct;
             rentPaid += deduct;
         }
         
         const totalPending = rentPending + hamaliPending;
         
         return {
           ...c,
           rentBilled,
           hamaliBilled,
           rentPaid,
           hamaliPaid,
           rentPending,
           hamaliPending,
           totalPending
         };
      }).filter(c => c.totalPending > 1);
  
      return {
        type: 'rent-pending-breakdown',
        data: reportData
      };
  }

  // 7. Lot Inventory Report
  if (reportType === 'lot-inventory') {
    const { data: records } = await supabase
      .from('storage_records')
      .select(`
        bags_stored,
        warehouse_lots (name),
        customers (name),
        crops (name)
      `)
      .eq('warehouse_id', warehouseId)
      .is('storage_end_date', null)
      .is('deleted_at', null);

    if (!records) return { type: 'lot-inventory', data: [] };

    // Group in memory: Lot -> Customer -> Crop -> Total Bags
    const groupedData: any[] = [];
    const map = new Map<string, number>();

    records.forEach((r: any) => {
      const lotName = r.warehouse_lots?.name || 'Unassigned';
      const customerName = r.customers?.name || 'Unknown';
      const cropName = r.crops?.name || 'Unknown';
      const key = `${lotName}|${customerName}|${cropName}`;
      
      map.set(key, (map.get(key) || 0) + (r.bags_stored || 0));
    });

    map.forEach((totalBags, key) => {
      const [lot_name, customer_name, crop_name] = key.split('|');
      groupedData.push({
        lot_name,
        customer_name,
        crop_name,
        total_bags: totalBags
      });
    });

    // Sort by lot name and then customer name
    groupedData.sort((a, b) => {
      if (a.lot_name !== b.lot_name) return a.lot_name.localeCompare(b.lot_name);
      return a.customer_name.localeCompare(b.customer_name);
    });

    return {
      type: 'lot-inventory',
      data: groupedData
    };
  }

  // 8. Transaction History (Fallback / Last 1000)
  if (reportType === 'transaction-history') {
    const { data: records } = await supabase
      .from('storage_records')
      .select(`
        *,
        customers (name)
      `)
      .eq('warehouse_id', warehouseId)
      .is('deleted_at', null)
      .order('storage_start_date', { ascending: false })
      .limit(1000); // Limit for safety
      
    return {
      type: 'transaction-history',
      data: records
    };
  }

  // 9. Hamali Register (Revenue)
  if (reportType === 'hamali-register') {
    let query = supabase
      .from('storage_records')
      .select(`
        *,
        customers (name)
      `)
      .eq('warehouse_id', warehouseId)
      .is('deleted_at', null)
      .gt('hamali_payable', 0)
      .order('storage_start_date', { ascending: false });

    if (filters?.startDate) query = query.gte('storage_start_date', filters.startDate);
    if (filters?.endDate) {
        const nextDay = new Date(filters.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('storage_start_date', nextDay.toISOString());
    }

    const { data: records } = await query;
    
    // Map snake_case to camelCase for UI compatibility and flatten customer
    const mappedRecords = records?.map((r: any) => ({
        ...r,
        storageStartDate: r.storage_start_date,
        storageEndDate: r.storage_end_date,
        bagsStored: r.bags_stored,
        bagsIn: r.bags_in || r.bags_stored, // Fallback if bags_in not tracked directly
        bagsOut: r.bags_out || 0,
        hamaliPayable: r.hamali_payable,
        totalRentBilled: r.total_rent_billed,
        customerId: r.customer_id,
        // Ensure customer object is accessible as 'customer' (standard) or use joined 'customers'
        customer: r.customers || r.customer,
        payments: r.payments || []
    }));

    return { type: 'hamali-register', data: mappedRecords, period: filters };
  }

  // 10. Unloading Register (Operational)
  if (reportType === 'unloading-register') {
    let query = supabase
        .from('unloading_records')
        .select(`
            *,
            customer:customers(name),
            crop:crops(name)
        `)
        .eq('warehouse_id', warehouseId)
        .is('deleted_at', null)
        .order('unload_date', { ascending: false });
    
    if (filters?.startDate) query = query.gte('unload_date', filters.startDate);
    if (filters?.endDate) {
        const nextDay = new Date(filters.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('unload_date', nextDay.toISOString());
    }

    const { data: records } = await query;
    return { type: 'unloading-register', data: records, period: filters };
  }

  // 11. Unloading Expenses
  if (reportType === 'unloading-expenses') {
      let query = supabase
          .from('expenses')
          .select('*')
          .eq('warehouse_id', warehouseId)
          .eq('category', 'Hamali')
          .is('deleted_at', null)
          .order('expense_date', { ascending: false });
      
      if (filters?.startDate) query = query.gte('expense_date', filters.startDate);
      if (filters?.endDate) {
          const nextDay = new Date(filters.endDate);
          nextDay.setDate(nextDay.getDate() + 1);
          query = query.lt('expense_date', nextDay.toISOString());
      }
      
      const { data: expenses } = await query;
      return { type: 'unloading-expenses', data: expenses, period: filters };
  }
  
      return null;
    } catch (error: any) {
      logError(error, { operation: 'fetchReportData', metadata: { reportType, filters } });
      throw error;
    }
  }
