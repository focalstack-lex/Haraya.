-- Sanctuary visits, Cup Clinks and passport privacy (2026-09-29).
-- Spec: docs/superpowers/specs/2026-09-29-sanctuary-passport-and-focus-logs.md
--
-- Rules enforced here, not in the browser:
--   * A visit belongs to the signed-in user who inserts it (user_id defaults to and must equal auth.uid()).
--     Clients insert only the listed columns: never id, created_at, clinks_count or visitor_name.
--   * visitor_name is copied from the author's profile by a trigger, so nobody can post under another name.
--   * Everyone reads a visit only when it is public AND its author's passport is public; authors always read
--     their own; admins read all. The device coordinates (user_lat, user_lng) are never readable by clients:
--     column grants leave them out, so a public session never reveals where someone was sitting.
--   * Six visits per user per 24 hours; durations 5 to 1440 minutes, a Quick Stamp is exactly 30.
--   * Cup Clinks: one per user per visit, only on public visits the caller can see, never on their own.
--     The clink counter and the profile focus total change only through SECURITY DEFINER triggers.
--
-- Differences from the spec SQL, on purpose:
--   * profiles has no is_admin column; admin checks use public.is_admin() (20260928230000).
--   * SECURITY DEFINER functions pin search_path (the spec versions did not).
--   * Profile privacy is enforced in the visit read policy through passport_is_public(), a definer function,
--     because profiles rows are not readable by other users.
--
-- Known limit: the 120 m geofence runs on the device. Cafe coordinates for curated spots live in the app, so
-- the database can only bound the reported distance (<= 150 m), not prove it. A spoofed GPS can still check in.

-- 1. Profiles: passport privacy and the running focus total --------------------------------------------

alter table public.profiles
  add column if not exists is_public_passport boolean not null default true,
  add column if not exists total_focus_minutes integer not null default 0;

-- Users may flip their own privacy; total_focus_minutes stays trigger-only (no client update grant).
grant update (is_public_passport) on public.profiles to authenticated;

create or replace function public.passport_is_public(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_public_passport from public.profiles where id = owner), false);
$$;

revoke all on function public.passport_is_public(uuid) from public;
grant execute on function public.passport_is_public(uuid) to anon, authenticated;

-- 2. Sanctuary visits ----------------------------------------------------------------------------------

create table if not exists public.sanctuary_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  visitor_name text not null default '',
  cafe_id text not null check (char_length(cafe_id) between 1 and 120),
  cafe_name text not null check (char_length(cafe_name) between 1 and 80),
  city text not null check (char_length(city) between 1 and 40),
  session_type text not null check (session_type in ('focus', 'stamp')),
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 1440),
  drink_ordered text check (drink_ordered is null or char_length(drink_ordered) <= 60),
  noise_level text check (noise_level in ('quiet', 'hum', 'buzzing')),
  outlets_status text check (outlets_status in ('plenty', 'crowded', 'none')),
  notes text check (notes is null or char_length(notes) <= 500),
  is_public boolean not null default true,
  user_lat numeric(9, 6) not null check (user_lat between 5.3 and 8.2),
  user_lng numeric(9, 6) not null check (user_lng between 125.0 and 126.7),
  verified_distance_meters numeric(7, 2) not null check (verified_distance_meters between 0 and 150),
  clinks_count integer not null default 0 check (clinks_count >= 0),
  created_at timestamptz not null default now(),
  constraint sanctuary_visits_stamp_duration check (session_type <> 'stamp' or duration_minutes = 30)
);

create index if not exists idx_sanctuary_visits_user_id on public.sanctuary_visits (user_id, created_at desc);
create index if not exists idx_sanctuary_visits_cafe_id on public.sanctuary_visits (cafe_id, created_at desc);

-- Server-set fields: author name from the profile, a zero clink count, and the insert time.
create or replace function public.prepare_sanctuary_visit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.visitor_name := coalesce(
    nullif(btrim((select name from public.profiles where id = new.user_id)), ''),
    'Haraya scout'
  );
  new.clinks_count := 0;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists prepare_sanctuary_visit on public.sanctuary_visits;
create trigger prepare_sanctuary_visit
  before insert on public.sanctuary_visits
  for each row execute function public.prepare_sanctuary_visit();

-- Six visits per user per rolling 24 hours.
create or replace function public.check_visit_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.sanctuary_visits
     where user_id = new.user_id and created_at >= now() - interval '1 day'
  ) >= 6 then
    raise exception 'visit_limit: You can log up to 6 visits a day' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_visit_rate_limit on public.sanctuary_visits;
create trigger trg_check_visit_rate_limit
  before insert on public.sanctuary_visits
  for each row execute function public.check_visit_rate_limit();

-- Profile focus total follows every new visit.
create or replace function public.handle_new_visit_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set total_focus_minutes = total_focus_minutes + new.duration_minutes
   where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_new_visit_stats on public.sanctuary_visits;
create trigger on_new_visit_stats
  after insert on public.sanctuary_visits
  for each row execute function public.handle_new_visit_stats();

-- 3. Cup Clinks ----------------------------------------------------------------------------------------

create table if not exists public.cup_clinks (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.sanctuary_visits(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (visit_id, user_id)
);

create index if not exists idx_cup_clinks_visit_id on public.cup_clinks (visit_id);

create or replace function public.handle_cup_clink_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.sanctuary_visits set clinks_count = clinks_count + 1 where id = new.visit_id;
  elsif tg_op = 'DELETE' then
    update public.sanctuary_visits set clinks_count = greatest(0, clinks_count - 1) where id = old.visit_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_cup_clink_change on public.cup_clinks;
create trigger on_cup_clink_change
  after insert or delete on public.cup_clinks
  for each row execute function public.handle_cup_clink_change();

revoke all on function public.prepare_sanctuary_visit() from public;
revoke all on function public.check_visit_rate_limit() from public;
revoke all on function public.handle_new_visit_stats() from public;
revoke all on function public.handle_cup_clink_change() from public;

-- 4. Row Level Security --------------------------------------------------------------------------------

alter table public.sanctuary_visits enable row level security;
alter table public.cup_clinks enable row level security;

drop policy if exists "Public visits or own visits are viewable" on public.sanctuary_visits;
create policy "Public visits or own visits are viewable"
  on public.sanctuary_visits for select
  using (
    auth.uid() = user_id
    or (is_public and public.passport_is_public(user_id))
    or public.is_admin()
  );

drop policy if exists "Authenticated users can insert own visit" on public.sanctuary_visits;
create policy "Authenticated users can insert own visit"
  on public.sanctuary_visits for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Clinks on visible visits are viewable" on public.cup_clinks;
create policy "Clinks on visible visits are viewable"
  on public.cup_clinks for select
  using (exists (select 1 from public.sanctuary_visits v where v.id = visit_id));

drop policy if exists "Authenticated users can clink once (not own visit)" on public.cup_clinks;
create policy "Authenticated users can clink once (not own visit)"
  on public.cup_clinks for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.sanctuary_visits v
       where v.id = visit_id
         and v.user_id <> auth.uid()
         and v.is_public
         and public.passport_is_public(v.user_id)
    )
  );

drop policy if exists "Users can remove their own clink" on public.cup_clinks;
create policy "Users can remove their own clink"
  on public.cup_clinks for delete
  to authenticated
  using (auth.uid() = user_id);

-- 5. Grants: anon reads only; clients never touch server-set columns or read device coordinates ---------

revoke all on public.sanctuary_visits from anon, authenticated;
grant select (
  id, user_id, visitor_name, cafe_id, cafe_name, city, session_type, duration_minutes, drink_ordered,
  noise_level, outlets_status, notes, is_public, verified_distance_meters, clinks_count, created_at
) on public.sanctuary_visits to anon, authenticated;
grant insert (
  user_id, cafe_id, cafe_name, city, session_type, duration_minutes, drink_ordered, noise_level,
  outlets_status, notes, is_public, user_lat, user_lng, verified_distance_meters
) on public.sanctuary_visits to authenticated;

revoke all on public.cup_clinks from anon, authenticated;
grant select (id, visit_id, user_id, created_at) on public.cup_clinks to anon, authenticated;
grant insert (visit_id, user_id) on public.cup_clinks to authenticated;
grant delete on public.cup_clinks to authenticated;
