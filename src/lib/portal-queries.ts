
import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';

export type PortfolioItem = {
    warehouseName: string;
    warehouseLocation: string;
    totalBags: number;
    totalPaid: number;
    totalBilled: number;
    records: any[];
};

export const getCustomerPortfolio = async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // 1. Find all Customer Profiles linked to this User
    const { data: customers } = await supabase
        .from('customers')
        .select(`
            id, 
            warehouse_id, 
            warehouses (name, location)
        `)
        .eq('linked_user_id', user.id);

    if (!customers || customers.length === 0) return [];

    const customerIds = customers.map(c => c.id);

    // 2. Fetch Storage Records and their Payments
    const { data: records } = await supabase
        .from('storage_records')
        .select(`
            *,
            crops (name),
            payments (*)
        `)
        .in('customer_id', customerIds)
        .order('storage_start_date', { ascending: false });

    if (!records) return [];

    // 3. Aggregate by Warehouse
    const portfolio: Record<string, PortfolioItem> = {};

    customers.forEach(c => {
        if (!portfolio[c.warehouse_id]) {
            // @ts-ignore
            const wName = c.warehouses?.name || 'Unknown Warehouse';
            // @ts-ignore
            const wLoc = c.warehouses?.location || '';
            
            portfolio[c.warehouse_id] = {
                warehouseName: wName,
                warehouseLocation: wLoc,
                totalBags: 0,
                totalPaid: 0,
                totalBilled: 0,
                records: []
            };
        }
    });

    records.forEach(r => {
        const whId = r.warehouse_id;
        if (portfolio[whId]) {
            // Calculate payments for this record
            const recordPayments = r.payments || [];
            const recordPaid = recordPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
            
            // For now, exposure is estimated or calculated based on rent triggers if implemented.
            // If the schema hasn't fully automated billing yet, we show what's recorded.
            const recordBilled = (r.total_rent_due || 0);

            const enrichedRecord = {
                ...r,
                paid: recordPaid,
                billed: recordBilled,
                is_active: r.storage_end_date === null
            };

            portfolio[whId].records.push(enrichedRecord);
            
            if (enrichedRecord.is_active) {
                portfolio[whId].totalBags += (r.bags_stored || 0);
            }
            portfolio[whId].totalPaid += recordPaid;
            portfolio[whId].totalBilled += recordBilled;
        }
    });

    return Object.values(portfolio).sort((a, b) => b.totalBags - a.totalBags);
};
