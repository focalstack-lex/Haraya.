-- New accounts are Gmail only.
--
-- The app's forms check the address (src/utils/gmailOnly.ts), but Supabase's sign-up and one-time-link endpoints
-- can be called directly with the public anon key, so the rule has to live here. Every new row in auth.users, by
-- any route (password sign-up, one-time link, an OAuth provider, the dashboard), is refused unless its email ends
-- in @gmail.com. Accounts that already exist are not touched and keep signing in as before. A row without an email
-- (a phone sign-up, which Haraya does not offer) is left alone.
--
-- Supabase reports the refusal to the caller as "Database error saving new user".
--
-- To add a non-Gmail account by hand (for example a staff address), in the SQL Editor:
--   alter table auth.users disable trigger enforce_gmail_signup;  -- create the user, then:
--   alter table auth.users enable trigger enforce_gmail_signup;
--
-- Rollback: drop trigger if exists enforce_gmail_signup on auth.users; drop function if exists public.enforce_gmail_signup();
--
-- Safe to run more than once. Keep the domain in step with GMAIL_DOMAIN in src/utils/gmailOnly.ts.

create or replace function public.enforce_gmail_signup()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.email is not null and lower(substring(btrim(new.email) from '@([^@]*)$')) is distinct from 'gmail.com' then
    raise exception 'Only Gmail addresses can create a Haraya account' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_gmail_signup() from public;

drop trigger if exists enforce_gmail_signup on auth.users;
create trigger enforce_gmail_signup
  before insert on auth.users
  for each row execute function public.enforce_gmail_signup();
