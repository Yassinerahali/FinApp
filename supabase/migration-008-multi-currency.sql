-- Run this once in your Supabase project's SQL Editor.
-- Adds a currency to each account (MAD/EUR/USD). Existing accounts
-- default to MAD, matching how they already behaved -- nothing
-- changes for accounts you don't touch.
--
-- Scope note: this covers accounts and the transactions linked to
-- them (they display in whichever currency their account uses).
-- Budgets, recurring bills, loans, goals, category breakdown, trends,
-- and the cash flow forecast all continue to be MAD-denominated --
-- they aren't tied to a specific account in the schema, and summing
-- different currencies together without a real exchange rate would
-- just produce a meaningless number. Ask if you want that extended.

alter table accounts
  add column if not exists currency text not null default 'MAD'
  check (currency in ('MAD', 'EUR', 'USD'));
