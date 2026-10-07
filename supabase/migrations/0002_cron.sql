-- Placement Survival Kit — reminder schedule (Phase 4)
-- Calls the `tick` Edge Function every 15 minutes. Replace the two placeholders,
-- or use the pre-filled copy generated locally at supabase/cron-setup.local.sql.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Stored in Supabase Vault (encrypted), not in the cron job text.
select vault.create_secret('https://YOUR-PROJECT-REF.supabase.co', 'project_url')
where not exists (select 1 from vault.secrets where name = 'project_url');
select vault.create_secret('YOUR-CRON-SECRET', 'cron_secret')
where not exists (select 1 from vault.secrets where name = 'cron_secret');

-- Re-running this replaces the job with the same name.
select cron.schedule(
  'survival-kit-tick',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Housekeeping: forget sent-notification records older than 30 days (keeps the table tiny).
select cron.schedule(
  'survival-kit-cleanup',
  '30 21 * * *', -- 03:00 IST
  $$ delete from public.notifications_sent where sent_at < now() - interval '30 days' $$
);
