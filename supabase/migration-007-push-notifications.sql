-- Run this once in your Supabase project's SQL Editor.
-- Adds real push notifications: subscriptions per device, and a log
-- used only to avoid re-sending the same alert every time the daily
-- check runs (so "rent due in 3 days" doesn't ping you three days
-- in a row).

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage their own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only the send-push edge function (via the service role key) reads or
-- writes this — it's how the daily check avoids duplicate sends.
create table if not exists push_notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_id text not null,
  sent_date date not null default current_date,
  unique (user_id, alert_id, sent_date)
);

alter table push_notification_log enable row level security;
-- No policies granted here on purpose: this table is only ever touched
-- by the edge function using the service role key, which bypasses RLS
-- entirely. Regular users (anon/authenticated) get zero access to it.
