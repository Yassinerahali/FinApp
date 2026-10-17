-- Run this once in your Supabase project's SQL Editor.
-- Adds admin_feature_adoption(): for each feature, how many distinct
-- users have used it. Same admin-only check as admin_list_users():
-- anyone other than the confirmed admin@choumchoum.com gets
-- "not authorized".
--
-- Note: AI chat usage is not stored per user anywhere, so it can't be
-- counted here.

create or replace function public.admin_feature_adoption()
returns table (
  total_users bigint,
  with_budgets bigint,
  with_recurring bigint,
  with_goals bigint,
  with_loans bigint,
  with_custom_categories bigint,
  with_push bigint
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
  select
    (select count(*) from auth.users),
    (select count(distinct b.user_id) from public.budgets b),
    (select count(distinct r.user_id) from public.recurring_rules r),
    (select count(distinct g.user_id) from public.savings_goals g),
    (select count(distinct l.user_id) from public.loans l),
    (select count(distinct c.user_id) from public.categories c),
    (select count(distinct p.user_id) from public.push_subscriptions p);
end;
$$;

revoke all on function public.admin_feature_adoption() from public, anon;
grant execute on function public.admin_feature_adoption() to authenticated;
