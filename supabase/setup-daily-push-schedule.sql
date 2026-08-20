-- Optional, one-time setup: schedules the daily "check for due bills/
-- budgets/loans" push notification run. Run this AFTER you've deployed
-- the send-push edge function and set its secrets (see README).
--
-- This uses pg_cron + pg_net, which need to be enabled first: in the
-- Supabase Dashboard go to Database -> Extensions, and turn on both
-- "pg_cron" and "pg_net" if they aren't already.
--
-- Replace the two placeholders below before running:
--   <YOUR_PROJECT_REF>  -- e.g. fkhsbgfuiszzuqkukweo (from your project URL)
--   <YOUR_CRON_SECRET>  -- the exact same value you set as the
--                          CRON_SECRET secret on the send-push function

select cron.schedule(
  'daily-push-check',
  '0 8 * * *', -- 8:00 AM UTC every day — adjust the hour to your timezone
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<YOUR_CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check it's scheduled: select * from cron.job;
-- To remove it later: select cron.unschedule('daily-push-check');
