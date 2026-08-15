-- Run this once in your Supabase project's SQL Editor.
-- Adds accounts (wallets) and savings goals to an existing database
-- that already has the tables from schema.sql.

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'cash' check (kind in ('cash', 'bank', 'card', 'other')),
  created_at timestamptz not null default now()
);

alter table transactions
  add column if not exists account_id uuid references accounts(id) on delete set null;

create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  saved_amount numeric not null default 0 check (saved_amount >= 0),
  target_date date,
  created_at timestamptz not null default now()
);

alter table accounts enable row level security;
alter table savings_goals enable row level security;

create policy "Users manage their own accounts"
  on accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own savings goals"
  on savings_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists transactions_account_idx on transactions (account_id);
