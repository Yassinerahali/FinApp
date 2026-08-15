-- Run this once in your Supabase project's SQL Editor.
-- Adds an opening balance to each account, for money that existed
-- before you started tracking it in the app. Safe to run even if you
-- already have accounts — they'll default to 0 (no change to their
-- current computed balance).

alter table accounts
  add column if not exists opening_balance numeric not null default 0;
