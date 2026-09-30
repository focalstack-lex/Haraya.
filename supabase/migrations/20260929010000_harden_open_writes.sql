-- Close open write paths found by the 2026-09-29 security gate (reports/security/2026-09-29-gate.md, checks 3,
-- 4 and 10). Sign-in is now open to anyone through Add a Spot, so every table a signed-in user can write to
-- needs bounded input and a rate limit, or no client write access at all.

-- 1. Cup Check is hidden since the discovery pivot, and its insert policy accepted any size and any display
--    name. Remove client writes until the feature returns with length checks, a server-set name and a limit.
drop policy if exists "Users can insert cup checks" on public.cup_checks;
revoke insert, update, delete on public.cup_checks from anon, authenticated;

-- 2. Profiles: bound the two fields users may edit (column grants from 20260928230000 already limit which).
alter table public.profiles drop constraint if exists profiles_name_length;
alter table public.profiles drop constraint if exists profiles_business_name_length;
alter table public.profiles
  add constraint profiles_name_length check (char_length(name) <= 80),
  add constraint profiles_business_name_length check (business_name is null or char_length(business_name) <= 120);

-- 3. Cafe saves: users manage only their own rows (existing policy); cap how many one account can hold.
create or replace function public.enforce_cafe_save_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.cafe_saves where user_id = new.user_id) >= 500 then
    raise exception 'save_limit: You can save up to 500 spots' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists cafe_saves_limit on public.cafe_saves;
create trigger cafe_saves_limit
  before insert on public.cafe_saves
  for each row execute function public.enforce_cafe_save_limit();

revoke all on function public.enforce_cafe_save_limit() from public;

-- 4. Anonymous visitors never write anywhere; reads stay governed by RLS.
revoke insert, update, delete on public.cafe_saves from anon;
revoke update, delete on public.profiles from anon;
