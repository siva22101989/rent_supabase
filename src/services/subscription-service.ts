import { createClient } from '@/utils/supabase/server';
import { logError } from '@/lib/error-logger';
import { Database, UserRole, SubscriptionStatus } from '@/types/db';

type Subscription = Database['public']['Tables']['subscriptions']['Row'] & {
    plans: Database['public']['Tables']['plans']['Row'] | null;
};

export async function getSubscription(warehouseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('warehouse_id', warehouseId)
    .single();

  if (error && error.code !== 'PGRST116') {
    logError(error, { operation: 'getSubscription', metadata: { warehouseId } });
    return null;
  }
  
  // Cast to correct type if needed (Supabase types usually match, but joins can be tricky)
  return data as unknown as Subscription | null;
}

export async function getSubscriptionWithUsage(warehouseId: string) {
  const subscription = await getSubscription(warehouseId);
  
  // If no subscription, we might want to return usage only or null?
  // Previous logic seemed to want usage even if no sub (Free tier implicit).
  // But if subscription is null, spreading it spreads nothing.
  
  const supabase = await createClient();

  // Parallelize fetches for performance
  const [
    { count: totalRecords },
    { count: monthlyRecords },
    { count: totalUsers }
  ] = await Promise.all([
    // 1. Total Storage Records
    supabase
        .from('storage_records')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .is('deleted_at', null),
    
    // 2. Monthly Inflows (records created this month)
    supabase
        .from('storage_records')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

    // 3. Team Size
    supabase
        .from('warehouse_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .is('deleted_at', null)
  ]);

  const usage = {
        total_records: totalRecords || 0,
        monthly_records: monthlyRecords || 0,
        total_users: totalUsers || 0
  };

  return {
    subscription,
    usage
  };
}

export async function checkSubscriptionLimits(warehouseId: string, action: 'add_record' | 'add_user'): Promise<{ allowed: boolean; message?: string }> {
    // We strictly need usage data for limits
    const { subscription, usage } = await getSubscriptionWithUsage(warehouseId);
    
    if (!subscription || !subscription.plans) {
        // Fallback for "Free Tier" or "No Plan"
        // This logic should ideally be driven by a default plan in DB, but hardcoding for safety here as per original code.
        const supabase = await createClient();
        // Since we already fetched usage, we check usage direct
        
        const FREE_LIMIT = 50;
        if ((usage.total_records || 0) >= FREE_LIMIT && action === 'add_record') {
             return { allowed: false, message: `Free Tier limit reached (${FREE_LIMIT} records). Please upgrade to add more.` };
        }
        return { allowed: true };
    }

    const { plans, status: rawStatus } = subscription;
    const status = rawStatus || SubscriptionStatus.ACTIVE;
    
    // Allow 'trialing' and 'active'
    if (status !== SubscriptionStatus.ACTIVE && status !== SubscriptionStatus.TRIALING) {
         return { allowed: false, message: `Subscription is ${status}. Please renew to continue.` };
    }

    // Auto-expire check
    if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
         return { allowed: false, message: "Subscription period has ended. Please renew to continue." };
    }

    if (action === 'add_record') {
        const limit = plans.max_storage_records;
        // if limit is null, it means unlimited
        if (limit !== null && usage.total_records >= limit) {
             return { allowed: false, message: `Plan limit reached (${limit} records). Please upgrade.` };
        }
    }
    
    if (action === 'add_user') {
         // Assuming max_warehouses is not the user limit. 
         // Original code didn't check user limit in checkSubscriptionLimits explicitly for 'add_user' in the snippet I saw? 
         // Wait, I saw `checkSubscriptionLimits(warehouseId, 'add_user')` call in `warehouse-actions.ts`.
         // Let's implement a safe default or check if plans has max_users field.
         // The DB types I wrote didn't have max_users. Let's assume unlimited or check max_warehouses?
         // Checking original code... it just returned { allowed: true } or similar logic. 
         // Update: Original code logic for 'add_user' was missing inside the `if (action === 'add_record')` block. 
         // It seems the original code passed 'add_user' but didn't have specific logic for it?
         // Let's look at `plans` table structure in my DB types. I only saw `max_warehouses`, `max_storage_records`.
         // I'll stick to permissive for now.
    }

    return { allowed: true };
}

export async function checkFeatureAccess(warehouseId: string, feature: string): Promise<{ allowed: boolean; message?: string }> {
    // Usage not needed for feature check, so lightweight fetch is better.
    const subscription = await getSubscription(warehouseId);
    
    if (!subscription || !subscription.plans) {
        return { allowed: false, message: "Upgrade to access this feature." };
    }

    const { plans, status } = subscription;
    
    if (status !== SubscriptionStatus.ACTIVE && status !== SubscriptionStatus.TRIALING) {
         return { allowed: false, message: "Subscription inactive. Please renew." };
    }

    if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
          return { allowed: false, message: "Subscription expired. Please renew." };
    }

    const features = plans.features as Record<string, boolean>;
    if (!features || !features[feature]) {
         return { allowed: false, message: `Your current plan (${plans.name}) does not support this feature.` };
    }

    return { allowed: true };
}

export async function checkWarehouseCreationLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
    const supabase = await createClient();
    
    // 1. Get current warehouse count
    const { count: warehouseCount, error: countError } = await supabase
        .from('warehouse_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('role', UserRole.OWNER); // Only count owned warehouses

    if (countError) {
         logError(countError, { operation: 'checkWarehouseCreationLimit' });
         return { allowed: false, message: 'Failed to verify plan limits' };
    }

    if ((warehouseCount || 0) === 0) {
        return { allowed: true };
    }

    // 2. Get User's Active Warehouse to check Plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('warehouse_id')
        .eq('id', userId)
        .single();
    
    if (profile?.warehouse_id) {
        const subscription = await getSubscription(profile.warehouse_id);
        const maxWarehouses = subscription?.plans?.max_warehouses || 1; // Default to 1 (Free)
        
        if ((warehouseCount || 0) >= maxWarehouses) {
            return { 
                allowed: false,
                message: `Upgrade Required: Your current plan (${subscription?.plans?.name || 'Free'}) allows ${maxWarehouses} warehouse(s).`
            };
        }
    }
    
    return { allowed: true };
}
