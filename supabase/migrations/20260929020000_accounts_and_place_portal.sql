-- Accounts, the admin Control Room and the Place Portal (2026-09-29).
--
-- Rules enforced here, not in the browser:
--   * Every Supabase Auth user has a profile (guest by default). The display name comes from sign-up
--     metadata; older users are backfilled. Clients can only edit name and business_name (20260928230000).
--   * Admins read every profile and change roles through admin_set_profile_role(); nobody can change
--     their own role.
--   * A place owner applies once through place_applications (own rows visible to them, all to admins;
--     insert only as themselves and pending; no client update or delete; 1 pending at a time, 3 a day).
--   * Approval (admin_review_place_application) creates the public cafes row, marks it verified and
--     makes the applicant a place owner (profiles.role = 'roaster', cafe_profile_id set), so the existing
--     "Owners and admins can update cafes" policy lets them edit their own listing only.
--   * Listing fields owners can edit are bounded with check constraints.
-- Depends on public.is_admin() from 20260928230000_fix_rls_privilege_escalation.sql.

-- 1. Profiles -----------------------------------------------------------------------------------------

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

-- Users created before the trigger existed get a profile too
insert into public.profiles (id, email, name, role, status)
select u.id, coalesce(u.email, ''), left(btrim(coalesce(u.raw_user_meta_data ->> 'name', '')), 80), 'guest', 'approved'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

drop policy if exists "Admins see all profiles" on public.profiles;
create policy "Admins see all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create or replace function public.admin_set_profile_role(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  if new_role not in ('guest', 'roaster', 'admin') then
    raise exception 'Invalid role %', new_role using errcode = '22023';
  end if;
  if target = auth.uid() then
    raise exception 'own_role: You cannot change your own role' using errcode = 'P0001';
  end if;
  update public.profiles
     set role = new_role,
         status = case when new_role = 'admin' then 'approved' else status end,
         updated_at = now()
   where id = target;
end;
$$;

revoke all on function public.admin_set_profile_role(uuid, text) from public;
grant execute on function public.admin_set_profile_role(uuid, text) to authenticated;

-- 2. Place applications -------------------------------------------------------------------------------

create table if not exists public.place_applications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  business_name text not null check (char_length(btrim(business_name)) between 2 and 120),
  place_type text not null check (place_type in ('cafe', 'roastery', 'study_spot')),
  city text not null check (city in ('Davao City', 'Tagum City', 'Digos City', 'Panabo City', 'Mati City', 'Samal Island')),
  district text not null check (char_length(btrim(district)) between 2 and 40),
  address text not null check (char_length(btrim(address)) between 4 and 200),
  lat double precision not null check (lat between 5.3 and 8.2),
  lng double precision not null check (lng between 125.0 and 126.7),
  permit_number text not null check (char_length(btrim(permit_number)) between 3 and 60),
  contact_name text not null check (char_length(btrim(contact_name)) between 2 and 80),
  contact_phone text not null default '' check (char_length(contact_phone) <= 30),
  description text not null default '' check (char_length(description) <= 600),
  owner_confirmed boolean not null check (owner_confirmed),
  review_note text check (char_length(review_note) <= 280),
  cafe_id text references public.cafes (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id)
);

create index if not exists place_applications_status_created_idx on public.place_applications (status, created_at desc);
create index if not exists place_applications_owner_created_idx on public.place_applications (owner_id, created_at desc);

alter table public.place_applications enable row level security;

drop policy if exists "Owners see their own applications" on public.place_applications;
create policy "Owners see their own applications"
  on public.place_applications for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Admins see all applications" on public.place_applications;
create policy "Admins see all applications"
  on public.place_applications for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Signed-in users apply as themselves" on public.place_applications;
create policy "Signed-in users apply as themselves"
  on public.place_applications for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and status = 'pending'
    and cafe_id is null
    and review_note is null
    and reviewed_at is null
    and reviewed_by is null
  );

revoke update, delete on public.place_applications from anon, authenticated;
revoke insert on public.place_applications from anon;

create or replace function public.enforce_place_application_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to apply' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.place_applications
    where owner_id = auth.uid() and status = 'pending'
  ) then
    raise exception 'pending_application: Your application is already waiting for review' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.place_applications
    where owner_id = auth.uid() and created_at > now() - interval '24 hours'
  ) >= 3 then
    raise exception 'daily_limit: You can send up to 3 applications a day' using errcode = 'P0001';
  end if;

  new.owner_id := auth.uid();
  new.status := 'pending';
  new.created_at := now();
  new.review_note := null;
  new.cafe_id := null;
  new.reviewed_at := null;
  new.reviewed_by := null;
  new.business_name := btrim(new.business_name);
  new.district := btrim(new.district);
  new.address := btrim(new.address);
  new.permit_number := btrim(new.permit_number);
  new.contact_name := btrim(new.contact_name);
  new.contact_phone := btrim(new.contact_phone);
  new.description := btrim(new.description);
  return new;
end;
$$;

drop trigger if exists place_applications_limits on public.place_applications;
create trigger place_applications_limits
  before insert on public.place_applications
  for each row execute function public.enforce_place_application_limits();

revoke all on function public.enforce_place_application_limits() from public;

-- 3. Listings: bounded owner-editable fields ------------------------------------------------------------

alter table public.cafes drop constraint if exists cafes_name_length;
alter table public.cafes add constraint cafes_name_length check (char_length(btrim(name)) between 2 and 120);
alter table public.cafes drop constraint if exists cafes_address_length;
alter table public.cafes add constraint cafes_address_length check (char_length(address) <= 200);
alter table public.cafes drop constraint if exists cafes_description_length;
alter table public.cafes add constraint cafes_description_length check (char_length(description) <= 1000);
alter table public.cafes drop constraint if exists cafes_signature_length;
alter table public.cafes add constraint cafes_signature_length check (char_length(signature) <= 120);
alter table public.cafes drop constraint if exists cafes_logo_url_length;
alter table public.cafes add constraint cafes_logo_url_length check (char_length(logo_url) <= 500);
alter table public.cafes drop constraint if exists cafes_wifi_range;
alter table public.cafes add constraint cafes_wifi_range check (wifi_mbps between 0 and 10000);
alter table public.cafes drop constraint if exists cafes_region_bounds;
alter table public.cafes add constraint cafes_region_bounds check (lat between 5.3 and 8.2 and lng between 125.0 and 126.7);
alter table public.cafes drop constraint if exists cafes_city_known;
alter table public.cafes add constraint cafes_city_known
  check (city in ('Davao City', 'Tagum City', 'Digos City', 'Panabo City', 'Mati City', 'Samal Island'));
alter table public.cafes drop constraint if exists cafes_array_sizes;
alter table public.cafes add constraint cafes_array_sizes check (
  cardinality(images) <= 8
  and cardinality(amenities) <= 10
  and cardinality(brew_methods) <= 8
  and cardinality(vibe_tags) <= 8
);
alter table public.cafes drop constraint if exists cafes_json_shapes;
alter table public.cafes add constraint cafes_json_shapes check (
  jsonb_typeof(menu) = 'array'
  and jsonb_array_length(menu) <= 60
  and jsonb_typeof(hours) = 'object'
);

-- 4. Admin review: approve creates the public listing and makes the applicant its owner ---------------

create or replace function public.admin_review_place_application(target uuid, new_status text, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.place_applications%rowtype;
  base_handle text;
  new_handle text;
  new_cafe_id text;
  suffix integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review applications' using errcode = '42501';
  end if;
  if new_status not in ('approved', 'rejected') then
    raise exception 'Invalid review status %', new_status using errcode = '22023';
  end if;

  select * into app from public.place_applications where id = target for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if app.status <> 'pending' then
    raise exception 'already_reviewed: This application was already reviewed' using errcode = 'P0001';
  end if;

  if new_status = 'rejected' then
    update public.place_applications
       set status = 'rejected',
           review_note = nullif(btrim(coalesce(note, '')), ''),
           reviewed_at = now(),
           reviewed_by = auth.uid()
     where id = target;
    return;
  end if;

  -- Public handle from the business name, made unique with a numeric suffix
  base_handle := btrim(regexp_replace(lower(app.business_name), '[^a-z0-9]+', '-', 'g'), '-');
  if base_handle = '' then
    base_handle := 'place';
  end if;
  new_handle := base_handle;
  while exists (select 1 from public.cafes where handle = new_handle) loop
    suffix := suffix + 1;
    new_handle := base_handle || '-' || suffix;
  end loop;

  insert into public.cafes (handle, name, is_roastery, city, district, address, lat, lng, description, vibe_tags, verified)
  values (
    new_handle,
    app.business_name,
    app.place_type = 'roastery',
    app.city,
    app.district,
    app.address,
    app.lat,
    app.lng,
    app.description,
    case when app.place_type = 'study_spot' then array['Study spot']::text[] else '{}'::text[] end,
    true
  )
  returning id into new_cafe_id;

  update public.place_applications
     set status = 'approved',
         cafe_id = new_cafe_id,
         review_note = nullif(btrim(coalesce(note, '')), ''),
         reviewed_at = now(),
         reviewed_by = auth.uid()
   where id = target;

  update public.profiles
     set role = case when role = 'admin' then 'admin' else 'roaster' end,
         status = 'approved',
         business_name = left(app.business_name, 120),
         cafe_profile_id = new_cafe_id,
         updated_at = now()
   where id = app.owner_id;
end;
$$;

revoke all on function public.admin_review_place_application(uuid, text, text) from public;
grant execute on function public.admin_review_place_application(uuid, text, text) to authenticated;

-- Granting the first admin: run once in the Supabase SQL editor (service role), never from the app:
--   update public.profiles set role = 'admin', status = 'approved' where email = '<your admin email>';
