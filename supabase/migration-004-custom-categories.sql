-- Run this once in your Supabase project's SQL Editor.
-- Adds user-defined categories (e.g. "Loans", "Debts") alongside the
-- built-in ones. A custom category's *name* is stored directly on
-- transactions/budgets/recurring_rules (they're plain text columns,
-- not foreign keys) — so deleting a custom category here never
-- breaks or relabels any past entry that already used it; it just
-- stops showing up as a choice for new ones.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "Users manage their own categories"
  on categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
