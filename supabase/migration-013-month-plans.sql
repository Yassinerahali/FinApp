-- Run this once in your Supabase project's SQL Editor.
-- Adds the Month cards feature: one row per user per month holding the
-- salary, the savings set aside from it, the savings objective, the
-- "master debts" figure and its title, plus that month's expenses.
--
-- The expenses (with their optional sub-expenses, paid flags and due
-- dates) are stored together as JSON in the `expenses` column, shaped:
--   [{ "id": "...", "name": "MUM", "amount": 700, "done": false,
--      "due": "2026-11-10",
--      "subs": [{ "id": "...", "name": "Groceries", "amount": 450, "done": true }] }]
-- Month cards are a planning tool: they don't create or change ledger
-- transactions.

create table if not exists month_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  salary numeric not null default 0 check (salary >= 0),
  savings numeric not null default 0 check (savings >= 0),
  savings_objective numeric not null default 0 check (savings_objective >= 0),
  debts numeric not null default 0 check (debts >= 0),
  debts_label text,
  expenses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table month_plans enable row level security;

create policy "Users manage their own month plans"
  on month_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
