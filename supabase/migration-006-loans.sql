-- Run this once in your Supabase project's SQL Editor.
-- Adds loans/debts tracking: money you've lent to someone (they owe
-- you) or borrowed from someone (you owe them). Independent of
-- transactions/categories — a repayment just adjusts remaining_amount,
-- it doesn't create a ledger entry on its own.

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

alter table loans enable row level security;

create policy "Users manage their own loans"
  on loans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
