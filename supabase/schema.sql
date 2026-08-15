-- Run this once in your Supabase project's SQL Editor
-- (Project -> SQL Editor -> New query -> paste -> Run)
--
-- If you already ran an earlier version of this file, don't re-run it —
-- use supabase/migration-002-accounts-goals.sql instead to add the
-- accounts/goals tables without touching your existing data.

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'cash' check (kind in ('cash', 'bank', 'card', 'other')),
  opening_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text not null,
  date date not null,
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null check (monthly_limit > 0),
  primary key (user_id, category)
);

create table if not exists recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text not null,
  day_of_month int not null check (day_of_month between 1 and 31),
  note text default '',
  start_date date not null,
  last_generated date,
  created_at timestamptz not null default now()
);

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
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table recurring_rules enable row level security;
alter table savings_goals enable row level security;

create policy "Users manage their own accounts"
  on accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own budgets"
  on budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own recurring rules"
  on recurring_rules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own savings goals"
  on savings_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists transactions_user_date_idx on transactions (user_id, date desc);
create index if not exists transactions_account_idx on transactions (account_id);
