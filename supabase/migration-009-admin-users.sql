-- Run this once in your Supabase project's SQL Editor.
-- Adds an admin-only function that lists every user with their email,
-- name and balance, for the Admin tab in the app.
--
-- Security: the check lives HERE, in the database, not just in the UI.
-- The function runs with elevated rights (security definer) so it can
-- read auth.users and everyone's accounts/transactions, but it refuses
-- to return anything unless the caller is signed in as the admin
-- account below AND that account's email is confirmed. Normal users
-- calling it get an error, and row-level security on the real tables
-- is left untouched.
--
-- IMPORTANT: make sure admin@choumchoum.com is already registered (and
-- confirmed) in your project before deploying, so nobody else can
-- sign up with that address first.

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  balance_mad numeric,
  balance_eur numeric,
  balance_usd numeric
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
    -- Transactions take their account's currency; ones with no account
    -- fold into MAD, matching the app's net-worth calculation.
    select t.user_id, coalesce(a.currency, 'MAD') as currency,
           sum(case when t.type = 'income' then t.amount else -t.amount end) as amount
    from public.transactions t
    left join public.accounts a on a.id = t.account_id
    group by t.user_id, coalesce(a.currency, 'MAD')
  ),
  combined as (
    select user_id, currency, amount from opening
    union all
    select user_id, currency, amount from moves
  ),
  totals as (
    select c.user_id,
      coalesce(sum(c.amount) filter (where c.currency = 'MAD'), 0) as mad,
      coalesce(sum(c.amount) filter (where c.currency = 'EUR'), 0) as eur,
      coalesce(sum(c.amount) filter (where c.currency = 'USD'), 0) as usd
    from combined c
    group by c.user_id
  )
  select
    u.id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'first_name', '')::text,
    coalesce(u.raw_user_meta_data->>'last_name', '')::text,
    u.created_at,
    u.last_sign_in_at,
    coalesce(t.mad, 0),
    coalesce(t.eur, 0),
    coalesce(t.usd, 0)
  from auth.users u
  left join totals t on t.user_id = u.id
  order by u.created_at desc;
end;
$$;

-- Nobody can call it anonymously; signed-in users can call it but the
-- check above rejects everyone except the admin.
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
