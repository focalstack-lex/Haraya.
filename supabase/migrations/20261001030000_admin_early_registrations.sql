-- Control Room, Promo tab: the accounts behind the early coffee offer (3 of the first 30), for admins only.
--
-- Returns the first 30 confirmed accounts in the same order early_registration_status() counts them (confirmed
-- email, ranked by confirmation time, admins not counted), then the sign-ups that have not confirmed yet (no place,
-- newest first, at most 200). Confirmation times live in auth.users, which the client cannot read, so this is a
-- security definer function that refuses anyone but an admin. The 30 must match EARLY_COFFEE_SLOTS in
-- src/config/launch.ts and the slots in 20261001020000_early_registration_30_slots.sql.
--
-- Rollback: drop function if exists public.admin_early_registrations(); (the Promo tab then says it needs this update)
--
-- Safe to run more than once. Depends on 20260928230000_fix_rls_privilege_escalation.sql (is_admin, profiles).

create or replace function public.admin_early_registrations()
returns table (place bigint, name text, email text, confirmed_at timestamptz, signed_up_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'Only admins can read the early registrations' using errcode = '42501';
  end if;
  return query
    (select r.place, r.name, r.email, r.confirmed_at, r.signed_up_at
       from (
         select row_number() over (order by u.email_confirmed_at, u.id) as place,
                p.name::text as name, p.email::text as email, u.email_confirmed_at as confirmed_at, u.created_at as signed_up_at
           from auth.users u
           join public.profiles p on p.id = u.id
          where u.email_confirmed_at is not null
            and p.role <> 'admin'
       ) r
      where r.place <= 30
      order by r.place)
    union all
    (select null::bigint, p.name::text, p.email::text, null::timestamptz, u.created_at
       from auth.users u
       join public.profiles p on p.id = u.id
      where u.email_confirmed_at is null
        and p.role <> 'admin'
      order by u.created_at desc
      limit 200);
end;
$$;

revoke all on function public.admin_early_registrations() from public;
grant execute on function public.admin_early_registrations() to authenticated;
