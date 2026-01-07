import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Create a Supabase client with the Auth context of the logged in user.
  // Use the service role key to bypass RLS for administrative updates
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Find expired trials
  const { data: expiredTrials, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*, warehouses(name)')
    .eq('status', 'trailing_trial')
    .lt('trial_end_date', new Date().toISOString());

  if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError }), { status: 500 });
  }

  // 2. Get free plan ID
  const { data: freePlan } = await supabase
    .from('plans')
    .select('id')
    .eq('tier', 'free')
    .single();
    
  if (!freePlan) {
      return new Response(JSON.stringify({ error: "Free plan not found" }), { status: 500 });
  }

  // 3. Downgrade expired trials
  const results = [];
  for (const sub of expiredTrials || []) {
    const { error: updateError } = await supabase.from('subscriptions').update({
      plan_id: freePlan.id,
      status: 'active',
      trial_end_date: null, // Clear trial date
      updated_at: new Date().toISOString()
    }).eq('id', sub.id);
    
    if (!updateError) {
        results.push({
            warehouse: sub.warehouses?.name || sub.warehouse_id,
            status: 'downgraded_to_free'
        });
        console.log(`Downgraded warehouse ${sub.warehouse_id} to free tier`);
    }
  }

  return new Response(
    JSON.stringify({ 
        success: true, 
        processed: results.length, 
        details: results 
    }),
    { 
        headers: { 'Content-Type': 'application/json' } 
    }
  )
})
