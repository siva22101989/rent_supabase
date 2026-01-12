import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Process expired subscriptions
    const { data: expiryResult, error: expiryError } = await supabase.rpc('auto_expire_subscriptions');
    
    if (expiryError) {
      console.error('Error processing expiries:', expiryError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: expiryError.message 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = Array.isArray(expiryResult) ? expiryResult[0] : expiryResult;
    
    // Send expiry notifications
    await sendNotifications(supabase, result);
    
    // Send proactive warnings (7, 3, 1 day before expiry)
    await sendWarnings(supabase);

    return new Response(
      JSON.stringify({ 
        success: true,
        timestamp: new Date().toISOString(),
        processed: result?.processed_count || 0,
        gracePeriod: result?.grace_period_count || 0,
        expired: result?.expired_count || 0,
        downgraded: result?.downgraded_count || 0
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendNotifications(supabase: any, result: any) {
  // Fetch grace period subscriptions
  const { data: gracePeriodSubs } = await supabase
    .from('subscriptions')
    .select('id, warehouse_id, current_period_end, grace_period_end')
    .eq('status', 'grace_period')
    .eq('grace_period_notified', false);

  for (const sub of gracePeriodSubs || []) {
    const daysLeft = Math.ceil(
      (new Date(sub.grace_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    await supabase.from('notifications').insert({
      warehouse_id: sub.warehouse_id,
      title: '⚠️ Subscription in Grace Period',
      message: `Your subscription expired on ${new Date(sub.current_period_end).toLocaleDateString()}. You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining to renew.`,
      type: 'warning',
      category: 'subscription'
    });
    
    await supabase
      .from('subscriptions')
      .update({ grace_period_notified: true })
      .eq('id', sub.id);
  }
}

async function sendWarnings(supabase: any) {
  const warningDays = [7, 3, 1];
  
  for (const days of warningDays) {
    const { data: expiring } = await supabase.rpc(
      'get_expiring_subscriptions',
      { days_ahead: days }
    );
    
    for (const sub of expiring || []) {
      await supabase.from('notifications').insert({
        warehouse_id: sub.warehouse_id,
        title: `⏰ Subscription Expiring in ${days} Day${days > 1 ? 's' : ''}`,
        message: `Your subscription will expire on ${new Date(sub.current_period_end).toLocaleDateString()}. Renew now to avoid interruption.`,
        type: 'warning',
        category: 'subscription'
      });
    }
  }
}
