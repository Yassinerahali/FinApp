-- Run this once in your Supabase project's SQL Editor.
-- Adds account-to-account transfers.
--
-- A transfer is ONE row that moves money out of one account and into
-- another, so it can never be half-applied (money leaving without
-- arriving). It deliberately lives outside the `transactions` table:
-- moving your own money isn't income or spending, so it must not
-- inflate your income/expense totals, budgets, or trends.
--
--   balance(account) = opening_balance
--                    + income - expenses        (transactions)
--                    - transfers sent (amount)
--                    + transfers received (to_amount)
--
-- `amount` is what leaves the source account (in the source's
-- currency). `to_amount` is what arrives in the destination (in the
-- destination's currency) -- identical to `amount` when both accounts
-- share a currency, different when you move e.g. MAD -> EUR.
--
-- Deleting an account keeps the transfers it took part in (the other
-- side keeps its balance); the deleted side simply becomes null.

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_account_id uuid references accounts(id) on delete set null,
  to_account_id uuid references accounts(id) on delete set null,
  amount numeric not null check (amount > 0),
  to_amount numeric not null check (to_amount > 0),
  date date not null,
  note text default '',
  created_at timestamptz not null default now(),
  check (
    from_account_id is null
    or to_account_id is null
    or from_account_id <> to_account_id
  )
);

alter table transfers enable row level security;

-- Besides "it's your row", both accounts must also be yours, so nobody
-- can point a transfer at another user's account.
create policy "Users manage their own transfers"
  on transfers for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      from_account_id is null
      or exists (
        select 1 from accounts a
        where a.id = from_account_id and a.user_id = auth.uid()
      )
    )
    and (
      to_account_id is null
      or exists (
        select 1 from accounts a
        where a.id = to_account_id and a.user_id = auth.uid()
      )
    )
  );

create index if not exists transfers_user_date_idx on transfers (user_id, date desc);
create index if not exists transfers_from_idx on transfers (from_account_id);
create index if not exists transfers_to_idx on transfers (to_account_id);
