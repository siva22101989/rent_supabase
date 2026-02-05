import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get expiring subscriptions
    const { data: expiringData, error: queryError } = await supabase
      .rpc('process_subscription_renewals');

    if (queryError) {
      console.error('Error fetching expiring subscriptions:', queryError);
      return new Response(
        JSON.stringify({ error: queryError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      total: expiringData?.length || 0,
      processed: 0,
      errors: [] as string[],
    };

    // Process each expiring subscription
    for (const sub of expiringData || []) {
      try {
        // Call Next.js API to create payment link
        // Since we can't directly import Next.js server actions from Edge Function,
        // we'll make an HTTP request to a dedicated endpoint
        const appUrl = Deno.env.get('APP_URL') || 'https://grainflow.vercel.app';
        const response = await fetch(`${appUrl}/api/subscription/create-renewal-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('INTERNAL_API_SECRET')}`,
          },
          body: JSON.stringify({
            warehouse_id: sub.warehouse_id,
            plan_tier: sub.plan_tier,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        results.processed++;
        console.log(`Renewal link created for warehouse ${sub.warehouse_id}`);
      } catch (error: any) {
        results.errors.push(`Warehouse ${sub.warehouse_id}: ${error.message}`);
        console.error(`Error processing warehouse ${sub.warehouse_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed}/${results.total} renewals`,
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
