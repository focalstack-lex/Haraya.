-- Fix two privilege escalation paths found in the 2026-09-28 compliance audit
-- (reports/copyright/2026-09-28-2321.md, Lens 3 P0).
--
-- 1. "Users can update own profile" had no column limit, so any signed-in user could set their own
--    role to 'admin' and status to 'approved' with the public anon key.
-- 2. "Roasters can update their cafes" only checked the caller's role, so any roaster could edit
--    every cafe in the catalog.

-- 1. Profiles: users may edit only their display fields --------------------------------------------

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Column privileges: role, status, cafe_profile_id and email can no longer be written by clients.
-- Changes to those go through admin_review_profile() below or the service role.
revoke update on public.profiles from anon, authenticated;
grant update (name, business_name, updated_at) on public.profiles to authenticated;

-- 2. Cafes: roasters may edit only the cafe linked to their own approved profile -------------------

drop policy if exists "Roasters can update their cafes" on public.cafes;

create policy "Owners and admins can update cafes"
  on public.cafes
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'roaster' and p.status = 'approved' and p.cafe_profile_id = cafes.id)
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'roaster' and p.status = 'approved' and p.cafe_profile_id = cafes.id)
        )
    )
  );

-- Owners edit listing content only. Verification, counters and the public handle are not
-- client-writable; verification goes through admin_set_cafe_verified() below.
revoke update on public.cafes from anon, authenticated;
grant update (
  name, is_roastery, city, district, address, lat, lng, images, logo_url, description,
  signature, menu, amenities, wifi_mbps, brew_methods, price_level, hours, vibe_tags
) on public.cafes to authenticated;

-- 3. Admin-only operations, checked in the database -------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.admin_review_profile(
  target uuid,
  new_status text,
  new_cafe_profile_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can review profiles' using errcode = '42501';
  end if;
  if new_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid status %', new_status using errcode = '22023';
  end if;
  update public.profiles
     set status = new_status,
         cafe_profile_id = coalesce(new_cafe_profile_id, cafe_profile_id),
         updated_at = now()
   where id = target;
end;
$$;

create or replace function public.admin_set_cafe_verified(target text, is_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can verify cafes' using errcode = '42501';
  end if;
  update public.cafes set verified = is_verified where id = target;
end;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.admin_review_profile(uuid, text, text) from public;
revoke all on function public.admin_set_cafe_verified(text, boolean) from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_review_profile(uuid, text, text) to authenticated;
grant execute on function public.admin_set_cafe_verified(text, boolean) to authenticated;

-- Granting the first admin: run once in the Supabase SQL editor (service role), never from the app:
--   update public.profiles set role = 'admin', status = 'approved' where email = '<your admin email>';
