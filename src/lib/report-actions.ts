'use server';

import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from '@/lib/queries';
import { logError } from './error-logger';

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
  
      if (!warehouseId) {
        throw new Error('Unauthorized');
      }
  
      // 0. Customer Dues Details (Single Customer)
      if (reportType === 'customer-dues-details') {
        if (!filters?.customerId) throw new Error("Customer ID required");

        const { data: customer } = await supabase.from('customers').select('*').eq('id', filters.customerId).single();
        if (!customer) throw new Error("Customer not found");
  
        // Fetch ALL records for customer WITH withdrawal transactions AND payment details
        const { data: records } = await supabase
          .from('storage_records')
          .select(`
              *,
              payments (amount, type, payment_date, notes),
              withdrawal_transactions (bags_withdrawn, withdrawal_date, rent_collected)
          `)
          .eq('customer_id', filters.customerId)
          .eq('warehouse_id', warehouseId)
          .is('deleted_at', null)
          .order('storage_start_date', { ascending: false });
  
        if (!records) return { type: 'customer-dues-details', data: [], customer };
  
        const processedRecords = records.map((record: any) => {
            // 1. Calculate Rent Due - SUM ALL WITHDRAWAL TRANSACTIONS
            let rentDue = 0;
            let isprojected = false;
  
            // Filter: If Hamali Only, ignore Rent Logic entirely
            if (filters?.duesType !== 'hamali') {
                // Sum rent from all withdrawal transactions for this record
                const withdrawals = record.withdrawal_transactions || [];
                rentDue = withdrawals.reduce((sum: number, w: any) => 
                  sum + (parseFloat(w.rent_collected) || 0), 0);
                
                // Note: Records with no withdrawals will have rentDue = 0
            }
  
            // 2. Hamali Due - FOR ALL RECORDS (both active and closed)
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
                endDate: record.storage_end_date,
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
                isProjected: isprojected,
                withdrawalTransactions: record.withdrawal_transactions || [], // Pass for PDF export
                payments: record.payments || [] // Pass payment history for PDF export
            };
        });
  
        // Sort: Active first, then by date desc
        processedRecords.sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
  
        const finalData = processedRecords.filter(r => 
            filters.includeHistory || r.totalBalance > 0 || r.status === 'Active'
        );
  
        // BUILD STATEMENT OF ACCOUNT - Chronological Transaction Ledger
        const transactions: any[] = [];
        
        records.forEach((record: any) => {
          transactions.push({
            date: record.storage_start_date,
            type: 'inflow',
            description: `Inflow - ${record.commodity_description || 'Storage'}`,
            invoiceNo: record.record_number || record.id.substring(0, 8),
            bagsIn: record.bags_stored,
            bagsOut: null,
            hamali: record.hamali_payable || 0,
            rent: null,
            credit: null
          });
          
          (record.withdrawal_transactions || []).forEach((wt: any) => {
            transactions.push({
              date: wt.withdrawal_date,
              type: 'outflow',
              description: 'Outflow',
              invoiceNo: record.record_number || record.id.substring(0, 8),
              bagsIn: null,
              bagsOut: wt.bags_withdrawn,
              hamali: null,
              rent: parseFloat(wt.rent_collected) || 0,
              credit: null
            });
          });
          
          (record.payments || []).forEach((p: any) => {
            transactions.push({
              date: p.payment_date,
              type: 'payment',
              description: `Payment - ${p.type || 'General'}`,
              invoiceNo: record.record_number || record.id.substring(0, 8),
              bagsIn: null,
              bagsOut: null,
              hamali: null,
              rent: null,
              credit: p.amount
            });
          });
        });
        
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        transactions.forEach(t => {
          runningBalance += (t.hamali || 0) + (t.rent || 0) - (t.credit || 0);
          t.balance = runningBalance;
        });
        
        const summary = {
          totalBagsIn: transactions.filter(t => t.type === 'inflow').reduce((sum, t) => sum + (t.bagsIn || 0), 0),
          totalBagsOut: transactions.filter(t => t.type === 'outflow').reduce((sum, t) => sum + (t.bagsOut || 0), 0),
          balanceStock: 0,
          totalHamali: transactions.filter(t => t.type === 'inflow').reduce((sum, t) => sum + (t.hamali || 0), 0),
          totalRent: transactions.filter(t => t.type === 'outflow').reduce((sum, t) => sum + (t.rent || 0), 0),
          totalPaid: transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + (t.credit || 0), 0),
          balanceDue: 0
        };
        
        summary.balanceStock = summary.totalBagsIn - summary.totalBagsOut;
        summary.balanceDue = (summary.totalHamali + summary.totalRent) - summary.totalPaid;
  
        return {
            type: 'customer-dues-details',
            data: finalData,
            customer,
            transactions,
            summary,
            duesType: filters.duesType
        };
    }

  // 1. All Customers Report
  if (reportType === 'all-customers') {
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('name');
      
    // Fetch active stats for each customer with payments
    const { data: activeRecords } = await supabase
      .from('storage_records')
      .select(`
        customer_id, 
        bags_stored, 
        total_rent_billed, 
        hamali_payable,
        storage_start_date,
        storage_end_date,
        payments (amount)
      `)
      .eq('warehouse_id', warehouseId)
      .is('deleted_at', null);
    
    // Calculate outstanding per customer
    const customersWithOutstanding = customers?.map(c => {
      const customerRecords = activeRecords?.filter(r => r.customer_id === c.id) || [];
      let totalDues = 0;
      let totalPaid = 0;
      let activeBags = 0;
            
      customerRecords.forEach((r: any) => {
        // Calculate billed amount - sum withdrawal transaction rents + hamali
        const withdrawals = r.withdrawal_transactions || [];
        const rentFromWithdrawals = withdrawals.reduce((sum: number, w: any) => 
          sum + (parseFloat(w.rent_collected) || 0), 0);
        
        let billed = rentFromWithdrawals + (r.hamali_payable || 0);
        
        // Count active bags
        activeBags += r.bags_stored || 0;
        
        const paid = (r.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
        totalDues += billed;
        totalPaid += paid;
      });
      
      return {
        ...c,
        activeBags,
        outstanding: Math.max(0, totalDues - totalPaid)
      };
    }) || customers;
    
    return { 
      type: 'all-customers', 
      data: customersWithOutstanding
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
        payments (amount),
        withdrawal_transactions (rent_collected)
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
         // Calculate rent from withdrawal transactions
         const withdrawals = r.withdrawal_transactions || [];
         const rentFromWithdrawals = withdrawals.reduce((sum: number, w: any) => 
           sum + (parseFloat(w.rent_collected) || 0), 0);
         
         let billed = rentFromWithdrawals + (r.hamali_payable || 0);
         
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
    }).filter(c => c.balance > 1) // Only showing > 1 to avoid rounding noise
       .sort((a, b) => b.balance - a.balance); // Sort by outstanding DESC

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
