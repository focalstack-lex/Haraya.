-- Every account gets a profile row the moment it is created.
--
-- The trigger that does this lives in 20260929000000_spot_submissions.sql, which has not been applied to the live
-- project, so accounts created there had no row in public.profiles: no name, no role, nothing for the app's role
-- checks (is_admin, owners) or the passport statistics to read. This file installs just that trigger and gives the
-- accounts that already exist their missing profile. It is safe to run more than once, and safe to run before or
-- after the other pending migrations (they replace the same function and trigger with identical definitions).

-- 1. The function: a guest profile carrying the name given at sign-up (Google sign-in supplies none; the app fills
--    it in afterwards). security definer, so it works while the new user has no session and row rules apply.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    left(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), 80),
    'guest',
    'approved'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. The trigger, fired for every new account (email sign-up before it is confirmed, and Google sign-in).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Accounts created while the trigger was missing get their profile now.
insert into public.profiles (id, email, name, role, status)
select u.id, coalesce(u.email, ''), left(btrim(coalesce(u.raw_user_meta_data ->> 'name', '')), 80), 'guest', 'approved'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- Check: both counts should match, and the trigger should be listed.
-- select (select count(*) from auth.users) as accounts, (select count(*) from public.profiles) as profiles;
-- select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;
