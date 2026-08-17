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

-- User-defined categories (e.g. "Loans", "Debts") alongside the built-in
-- ones. A custom category's name is stored directly on
-- transactions/budgets/recurring_rules (plain text columns, not foreign
-- keys), so deleting one here never relabels past entries.
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

-- Money lent to someone (they owe you) or borrowed from someone (you
-- owe them). A repayment just adjusts remaining_amount — independent
-- of transactions/categories.
create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('lent', 'borrowed')),
  counterparty_name text not null,
  principal_amount numeric not null check (principal_amount > 0),
  remaining_amount numeric not null check (remaining_amount >= 0),
  due_date date,
  note text default '',
  created_at timestamptz not null default now()
);

alter table accounts enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table recurring_rules enable row level security;
alter table savings_goals enable row level security;
alter table categories enable row level security;
alter table loans enable row level security;

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

create policy "Users manage their own categories"
  on categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own loans"
  on loans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists transactions_user_date_idx on transactions (user_id, date desc);
create index if not exists transactions_account_idx on transactions (account_id);

-- Profile pictures. First/last name and the avatar URL itself live in
-- Supabase Auth's built-in user metadata, not a table.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can replace their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
