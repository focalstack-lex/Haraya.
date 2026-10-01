-- Soft-launch promo: the first 20 registered accounts get the opportunity of a coffee at a selected coffee shop.
--
-- The order is decided here, not on the device. An account counts once its email is confirmed (Google sign-ins
-- are confirmed on creation), ranked by the moment it was confirmed, so an address that never confirms cannot
-- hold a slot and nobody already inside the first 20 can be pushed out by a later confirmation. Admins are not
-- counted. A deleted account leaves the ranking and everyone after it moves up one.
--
-- The client reads early_registration_status(): how many of the 20 slots are taken, and the caller's own
-- position. The total number of accounts is never revealed past the cap. The slot count must match
-- EARLY_COFFEE_SLOTS in src/config/launch.ts.
--
-- To list the first 20 for contacting them, run in the SQL Editor:
--   select row_number() over (order by u.email_confirmed_at, u.id) as position, p.name, p.email, u.email_confirmed_at
--     from auth.users u join public.profiles p on p.id = u.id
--    where u.email_confirmed_at is not null and p.role <> 'admin'
--    order by position limit 20;
--
-- Rollback: drop function if exists public.early_registration_status(); (the page then shows the offer without a count)
--
-- Safe to run more than once. Depends on 20260928230000_fix_rls_privilege_escalation.sql (profiles, roles).

create or replace function public.early_registration_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select u.id, row_number() over (order by u.email_confirmed_at, u.id) as position
      from auth.users u
      join public.profiles p on p.id = u.id
     where u.email_confirmed_at is not null
       and p.role <> 'admin'
  )
  select jsonb_build_object(
    'slots', 20,
    'claimed', least((select count(*) from ranked), 20),
    'position', (select r.position from ranked r where r.id = auth.uid())
  );
$$;

revoke all on function public.early_registration_status() from public;
grant execute on function public.early_registration_status() to anon, authenticated;
