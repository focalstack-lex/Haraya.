-- Soft-launch promo, revised: 3 of the first 30 registered accounts will have the opportunity of a coffee at a
-- selected coffee shop (to be announced). Supersedes the 20 slots of 20261001000000_early_registration_promo.sql;
-- the ranking rules are unchanged (confirmed email, ordered by confirmation time, admins not counted).
--
-- The client reads early_registration_status(): how many of the 30 places are taken, and the caller's own
-- position. The slot count must match EARLY_COFFEE_SLOTS in src/config/launch.ts; until this runs, the page sees
-- the old 20 and shows the offer without a count rather than a wrong number.
--
-- To list the first 30, run in the SQL Editor:
--   select row_number() over (order by u.email_confirmed_at, u.id) as position, p.name, p.email, u.email_confirmed_at
--     from auth.users u join public.profiles p on p.id = u.id
--    where u.email_confirmed_at is not null and p.role <> 'admin'
--    order by position limit 30;
--
-- Rollback: run 20261001000000_early_registration_promo.sql again (back to 20 slots).
--
-- Safe to run more than once. Depends on 20261001000000_early_registration_promo.sql.

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
    'slots', 30,
    'claimed', least((select count(*) from ranked), 30),
    'position', (select r.position from ranked r where r.id = auth.uid())
  );
$$;

revoke all on function public.early_registration_status() from public;
grant execute on function public.early_registration_status() to anon, authenticated;
