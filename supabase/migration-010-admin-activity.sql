-- Run this once in your Supabase project's SQL Editor, AFTER
-- migration-009-admin-users.sql.
-- Replaces admin_list_users() so it also returns, for each user, how
-- many transactions and accounts they have and the date of their latest
-- transaction. Same admin-only check as before: anyone other than the
-- confirmed admin@choumchoum.com gets "not authorized".

-- The return columns change, so the old version must be dropped first.
drop function if exists public.admin_list_users();

create function public.admin_list_users()
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  balance_mad numeric,
  balance_eur numeric,
  balance_usd numeric,
  tx_count bigint,
  account_count bigint,
  last_tx_date date
)
language plpgsql
security definer
set search_path = public, auth
stable
as $$
begin
  if not exists (
    select 1
    from auth.users au
    where au.id = auth.uid()
      and lower(au.email) = 'admin@choumchoum.com'
      and au.email_confirmed_at is not null
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  with opening as (
    select a.user_id, coalesce(a.currency, 'MAD') as currency,
           sum(coalesce(a.opening_balance, 0)) as amount
    from public.accounts a
    group by a.user_id, coalesce(a.currency, 'MAD')
  ),
  moves as (
    select t.user_id, coalesce(a.currency, 'MAD') as currency,
           sum(case when t.type = 'income' then t.amount else -t.amount end) as amount
    from public.transactions t
    left join public.accounts a on a.id = t.account_id
    group by t.user_id, coalesce(a.currency, 'MAD')
  ),
  combined as (
    select o.user_id, o.currency, o.amount from opening o
    union all
    select m.user_id, m.currency, m.amount from moves m
  ),
  totals as (
    select c.user_id,
      coalesce(sum(c.amount) filter (where c.currency = 'MAD'), 0) as mad,
      coalesce(sum(c.amount) filter (where c.currency = 'EUR'), 0) as eur,
      coalesce(sum(c.amount) filter (where c.currency = 'USD'), 0) as usd
    from combined c
    group by c.user_id
  ),
  tx_stats as (
    select t.user_id, count(*) as n_tx, max(t.date) as last_date
    from public.transactions t
    group by t.user_id
  ),
  acct_stats as (
    select a.user_id, count(*) as n_acct
    from public.accounts a
    group by a.user_id
  )
  select
    u.id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'first_name', '')::text,
    coalesce(u.raw_user_meta_data->>'last_name', '')::text,
    u.created_at,
    u.last_sign_in_at,
    coalesce(tt.mad, 0),
    coalesce(tt.eur, 0),
    coalesce(tt.usd, 0),
    coalesce(ts.n_tx, 0)::bigint,
    coalesce(ac.n_acct, 0)::bigint,
    ts.last_date::date
  from auth.users u
  left join totals tt on tt.user_id = u.id
  left join tx_stats ts on ts.user_id = u.id
  left join acct_stats ac on ac.user_id = u.id
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
