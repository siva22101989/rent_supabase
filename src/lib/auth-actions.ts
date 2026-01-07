'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTrialSubscription(userId: string, planTier: string = 'starter') {
  const supabase = await createClient();
  
  // 1. Get user's warehouse (created during onboarding trigger usually, or we need to wait/check)
  // Assuming the trigger on auth.users -> profiles -> user_warehouses -> warehouses flow handles this,
  // but we might be racing if we call this immediately after signup.
  // Ideally, this logic should be in a database trigger, but we want flexibility.
  // Let's retry a few times if warehouse isn't found immediately.
  
  let warehouseId: string | null = null;
  let attempts = 0;
  
  while (!warehouseId && attempts < 3) {
      const { data: userWarehouse } = await supabase
        .from('user_warehouses')
        .select('warehouse_id')
        .eq('user_id', userId)
        .single();
        
      if (userWarehouse) {
          warehouseId = userWarehouse.warehouse_id;
      } else {
          // Wait 1s and retry (race condition with DB trigger)
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
      }
  }
  
  if (!warehouseId) {
      console.error('Failed to find warehouse for new user:', userId);
      return { success: false, message: 'Could not find warehouse to attach subscription.' };
  }
    
  // 2. Get plan details
  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('tier', planTier)
    .single();
    
  if (!plan) {
      console.error('Invalid plan tier requested:', planTier);
      return { success: false, message: 'Invalid plan selected.' };
  }
    
  // 3. Create trial subscription
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14); // 14 Day Trial
  
  const { error } = await supabase.from('subscriptions').upsert({
    warehouse_id: warehouseId,
    plan_id: plan.id,
    status: 'trailing_trial',
    trial_start_date: new Date().toISOString(),
    trial_end_date: trialEnd.toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'warehouse_id' });
  
  if (error) {
      console.error('Error creating trial subscription:', error);
      return { success: false, message: error.message };
  }
  
  revalidatePath('/dashboard');
  return { success: true };
}
