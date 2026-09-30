-- Community "Add a Spot" submissions (discovery pivot, 2026-09-29).
--
-- Rules enforced here, not in the browser:
--   * Only signed-in users can submit, only as themselves, and only as 'pending'.
--   * A spot becomes public only after an admin approves it (admin_review_submission).
--   * Contributors see their own submissions; everyone sees approved ones; admins see all.
--   * Rate limits: 5 submissions per user per 24 hours, at most 10 waiting for review.
--   * Field limits and a Davao Region bounding box are check constraints.
-- Depends on public.is_admin() from 20260928230000_fix_rls_privilege_escalation.sql.

create table if not exists public.spot_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  city text not null check (city in ('Davao City', 'Tagum City', 'Digos City', 'Panabo City', 'Mati City', 'Samal Island')),
  district text not null check (char_length(btrim(district)) between 2 and 40),
  address text not null check (char_length(btrim(address)) between 4 and 160),
  -- Davao Region bounding box, generous on every side
  lat double precision not null check (lat between 5.3 and 8.2),
  lng double precision not null check (lng between 125.0 and 126.7),
  amenities text[] not null default '{}' check (
    cardinality(amenities) <= 10
    and amenities <@ array['plugs', 'fastWifi', 'aircon', 'quietFocus', 'petFriendly', 'outdoor']::text[]
  ),
  vibes text[] not null default '{}' check (
    cardinality(vibes) <= 4
    and vibes <@ array['quietStudy', 'fastWifiWork', 'hiddenNook', 'lateNight']::text[]
  ),
  price_level smallint not null check (price_level in (1, 2, 3)),
  opens_at time,
  closes_at time,
  tip text not null default '' check (char_length(tip) <= 280),
  public_place_confirmed boolean not null check (public_place_confirmed),
  review_note text check (char_length(review_note) <= 280),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id),
  check ((opens_at is null) = (closes_at is null))
);

create index if not exists spot_submissions_status_created_idx on public.spot_submissions (status, created_at desc);
create index if not exists spot_submissions_owner_created_idx on public.spot_submissions (submitted_by, created_at desc);

alter table public.spot_submissions enable row level security;

drop policy if exists "Approved spots are public" on public.spot_submissions;
create policy "Approved spots are public"
  on public.spot_submissions for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "Contributors see their own submissions" on public.spot_submissions;
create policy "Contributors see their own submissions"
  on public.spot_submissions for select
  to authenticated
  using (submitted_by = auth.uid());

drop policy if exists "Admins see all submissions" on public.spot_submissions;
create policy "Admins see all submissions"
  on public.spot_submissions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Signed-in users submit pending spots as themselves" on public.spot_submissions;
create policy "Signed-in users submit pending spots as themselves"
  on public.spot_submissions for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and review_note is null
    and reviewed_at is null
    and reviewed_by is null
  );

-- No client updates or deletes; review goes through admin_review_submission()
revoke update, delete on public.spot_submissions from anon, authenticated;
revoke insert on public.spot_submissions from anon;

-- Rate limits and server-owned fields --------------------------------------------------------------

create or replace function public.enforce_spot_submission_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to add a spot' using errcode = '42501';
  end if;

  if (
    select count(*) from public.spot_submissions
    where submitted_by = auth.uid() and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'daily_limit: You can add up to 5 spots a day' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.spot_submissions
    where submitted_by = auth.uid() and status = 'pending'
  ) >= 10 then
    raise exception 'pending_limit: 10 of your spots are already waiting for review' using errcode = 'P0001';
  end if;

  new.submitted_by := auth.uid();
  new.status := 'pending';
  new.created_at := now();
  new.review_note := null;
  new.reviewed_at := null;
  new.reviewed_by := null;
  new.name := btrim(new.name);
  new.address := btrim(new.address);
  new.district := btrim(new.district);
  new.tip := btrim(new.tip);
  return new;
end;
$$;

drop trigger if exists spot_submissions_limits on public.spot_submissions;
create trigger spot_submissions_limits
  before insert on public.spot_submissions
  for each row execute function public.enforce_spot_submission_limits();

-- Admin review ---------------------------------------------------------------------------------------

create or replace function public.admin_review_submission(target uuid, new_status text, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can review spots' using errcode = '42501';
  end if;
  if new_status not in ('approved', 'rejected') then
    raise exception 'Invalid review status %', new_status using errcode = '22023';
  end if;
  update public.spot_submissions
     set status = new_status,
         review_note = nullif(btrim(coalesce(note, '')), ''),
         reviewed_at = now(),
         reviewed_by = auth.uid()
   where id = target;
end;
$$;

revoke all on function public.admin_review_submission(uuid, text, text) from public;
grant execute on function public.admin_review_submission(uuid, text, text) to authenticated;
revoke all on function public.enforce_spot_submission_limits() from public;

-- Profiles for new sign-ins --------------------------------------------------------------------------
-- Every Supabase Auth user gets a guest profile so is_admin() and ownership checks have a row to read.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, status)
  values (new.id, coalesce(new.email, ''), '', 'guest', 'approved')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
