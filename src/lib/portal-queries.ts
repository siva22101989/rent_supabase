
import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';

export type PortfolioItem = {
    warehouseName: string;
    warehouseLocation: string;
    totalBags: number;
    estimatedValue: number; // Placeholder for now usually
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

    // 2. Fetch Storage Records for these customers
    const { data: records } = await supabase
        .from('storage_records')
        .select(`
            *,
            crops (name)
        `)
        .in('customer_id', customerIds)
        .is('storage_end_date', null); // Active records only

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
                estimatedValue: 0,
                records: []
            };
        }
    });

    records.forEach(r => {
        const whId = r.warehouse_id;
        if (portfolio[whId]) {
            portfolio[whId].records.push(r);
            portfolio[whId].totalBags += (r.bags_stored || 0);
        }
    });

    return Object.values(portfolio);
};
