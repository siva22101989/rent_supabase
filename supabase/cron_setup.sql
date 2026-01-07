-- Enable the pg_cron extension if not already enabled
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the daily check for trial expirations
-- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY with your actual Service Role Key (from Project Settings > API)
-- This requires the Service Role Key to bypass RLS and update subscription statuses.

select
  cron.schedule(
    'check-trial-expirations',
    '0 0 * * *', -- Run every day at midnight (UTC)
    $$
    select
      net.http_post(
        url:='https://ayndosipsjjcagfrdglg.supabase.co/functions/v1/check-trial-expirations',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bmRvc2lwc2pqY2FnZnJkZ2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk0ODUzOCwiZXhwIjoyMDgxNTI0NTM4fQ.JXkSAFaaW8hj5mdGBJdB2ZyFK_UXcG6aMakUelFfLPc"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- To check scheduled jobs:
-- select * from cron.job;

-- To un-schedule:
-- select cron.unschedule('check-trial-expirations');
