-- Control Room tools, moderation, notifications, account sync and telemetry (2026-09-30).
--
-- What this adds, all enforced here and not in the browser:
--   1. Listings: a status (listed, hidden, closed), an owner announcement, and admin create / import / status.
--   2. Account suspension: a suspended account cannot write anywhere.
--   3. An audit log of every admin action, written by triggers so no admin path can skip it.
--   4. Reports from visitors (a spot, a check-in or a review) with an admin queue.
--   5. Admin removal of a check-in.
--   6. In-app notifications written by triggers (spot and application reviews, reports, Cup Clinks).
--   7. Saved spots and written reviews kept on the account.
--   8. Client error reports and anonymous usage events, capped and pruned, readable by admins only.
--   9. Self-service account deletion.
--  10. Listing stats for the owner.
--  11. A storage bucket for place photos.
--
-- Safe to run more than once. Depends on every earlier migration (is_admin, cafes, profiles, spot_submissions,
-- place_applications, sanctuary_visits, cup_clinks).

-- 1. Listings ------------------------------------------------------------------------------------------

alter table public.cafes
  add column if not exists status text not null default 'listed',
  add column if not exists notice text not null default '',
  add column if not exists notice_until date;

alter table public.cafes drop constraint if exists cafes_status_known;
alter table public.cafes add constraint cafes_status_known check (status in ('listed', 'hidden', 'closed'));
alter table public.cafes drop constraint if exists cafes_notice_length;
alter table public.cafes add constraint cafes_notice_length check (char_length(notice) <= 200);
-- Photos are links, never inline image data
alter table public.cafes drop constraint if exists cafes_images_are_links;
alter table public.cafes add constraint cafes_images_are_links check (char_length(array_to_string(images, '')) <= 4000);

-- Owners (and admins) may post an announcement; status stays admin-only through admin_set_cafe_status()
grant update (notice, notice_until) on public.cafes to authenticated;

create or replace function public.unique_cafe_handle(place_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  new_handle text;
  suffix integer := 0;
begin
  base_handle := btrim(regexp_replace(lower(coalesce(place_name, '')), '[^a-z0-9]+', '-', 'g'), '-');
  if base_handle = '' then
    base_handle := 'place';
  end if;
  new_handle := base_handle;
  while exists (select 1 from public.cafes where handle = new_handle) loop
    suffix := suffix + 1;
    new_handle := base_handle || '-' || suffix;
  end loop;
  return new_handle;
end;
$$;

revoke all on function public.unique_cafe_handle(text) from public;

-- One listing from a JSON object with the cafes column names. Table constraints validate the values.
create or replace function public.admin_create_cafe(payload jsonb, is_verified boolean default false)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add places' using errcode = '42501';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Invalid place' using errcode = '22023';
  end if;

  insert into public.cafes (
    handle, name, is_roastery, city, district, address, lat, lng, description, signature,
    amenities, wifi_mbps, brew_methods, price_level, hours, menu, vibe_tags, verified
  )
  values (
    public.unique_cafe_handle(payload ->> 'name'),
    btrim(coalesce(payload ->> 'name', '')),
    coalesce((payload ->> 'is_roastery')::boolean, false),
    payload ->> 'city',
    btrim(coalesce(payload ->> 'district', '')),
    btrim(coalesce(payload ->> 'address', '')),
    (payload ->> 'lat')::double precision,
    (payload ->> 'lng')::double precision,
    btrim(coalesce(payload ->> 'description', '')),
    btrim(coalesce(payload ->> 'signature', '')),
    array(select jsonb_array_elements_text(coalesce(payload -> 'amenities', '[]'::jsonb))),
    coalesce((payload ->> 'wifi_mbps')::integer, 0),
    array(select jsonb_array_elements_text(coalesce(payload -> 'brew_methods', '[]'::jsonb))),
    coalesce((payload ->> 'price_level')::smallint, 0),
    coalesce(payload -> 'hours', '{}'::jsonb),
    coalesce(payload -> 'menu', '[]'::jsonb),
    array(select jsonb_array_elements_text(coalesce(payload -> 'vibe_tags', '[]'::jsonb))),
    is_verified
  )
  returning id into new_id;
  return new_id;
end;
$$;

-- Many listings at once. All or nothing: one bad row cancels the whole import and names the row.
create or replace function public.admin_import_cafes(places jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  idx integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Only admins can import places' using errcode = '42501';
  end if;
  if places is null or jsonb_typeof(places) <> 'array' then
    raise exception 'Invalid import' using errcode = '22023';
  end if;
  if jsonb_array_length(places) > 200 then
    raise exception 'import_too_large: Import up to 200 places at a time' using errcode = 'P0001';
  end if;
  for item in select value from jsonb_array_elements(places) loop
    idx := idx + 1;
    begin
      perform public.admin_create_cafe(item, false);
    exception when others then
      raise exception 'import_row: Row % could not be added (%)', idx, sqlerrm using errcode = 'P0001';
    end;
  end loop;
  return idx;
end;
$$;

create or replace function public.admin_set_cafe_status(target text, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change a listing status' using errcode = '42501';
  end if;
  if new_status not in ('listed', 'hidden', 'closed') then
    raise exception 'Invalid status %', new_status using errcode = '22023';
  end if;
  update public.cafes set status = new_status where id = target;
end;
$$;

revoke all on function public.admin_create_cafe(jsonb, boolean) from public;
revoke all on function public.admin_import_cafes(jsonb) from public;
revoke all on function public.admin_set_cafe_status(text, text) from public;
grant execute on function public.admin_create_cafe(jsonb, boolean) to authenticated;
grant execute on function public.admin_import_cafes(jsonb) to authenticated;
grant execute on function public.admin_set_cafe_status(text, text) to authenticated;

-- 2. Account suspension --------------------------------------------------------------------------------

alter table public.profiles add column if not exists suspended_at timestamptz;

create or replace function public.is_suspended()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and suspended_at is not null);
$$;

revoke all on function public.is_suspended() from public;
grant execute on function public.is_suspended() to authenticated;

create or replace function public.block_suspended_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_suspended() then
    raise exception 'account_suspended: This account is restricted and cannot post right now' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.block_suspended_writes() from public;

-- Named to sort first, so it runs before the rate-limit triggers
drop trigger if exists a_block_suspended on public.spot_submissions;
create trigger a_block_suspended before insert on public.spot_submissions
  for each row execute function public.block_suspended_writes();
drop trigger if exists a_block_suspended on public.place_applications;
create trigger a_block_suspended before insert on public.place_applications
  for each row execute function public.block_suspended_writes();
drop trigger if exists a_block_suspended on public.sanctuary_visits;
create trigger a_block_suspended before insert on public.sanctuary_visits
  for each row execute function public.block_suspended_writes();
drop trigger if exists a_block_suspended on public.cup_clinks;
create trigger a_block_suspended before insert on public.cup_clinks
  for each row execute function public.block_suspended_writes();
drop trigger if exists a_block_suspended on public.cafes;
create trigger a_block_suspended before update on public.cafes
  for each row execute function public.block_suspended_writes();

create or replace function public.admin_set_profile_suspended(target uuid, suspended boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can restrict accounts' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'own_account: You cannot restrict your own account' using errcode = 'P0001';
  end if;
  update public.profiles
     set suspended_at = case when suspended then coalesce(suspended_at, now()) else null end,
         updated_at = now()
   where id = target;
end;
$$;

revoke all on function public.admin_set_profile_suspended(uuid, boolean) from public;
grant execute on function public.admin_set_profile_suspended(uuid, boolean) to authenticated;

-- 3. Reports -------------------------------------------------------------------------------------------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('spot', 'visit', 'review')),
  target_id text not null check (char_length(target_id) between 1 and 120),
  target_label text not null default '' check (char_length(target_label) <= 120),
  reason text not null check (reason in ('closed', 'wrong_info', 'wrong_location', 'duplicate', 'inappropriate', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution_note text check (char_length(resolution_note) <= 280),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id)
);

create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists reports_reporter_created_idx on public.reports (reporter_id, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "Reporters see their own reports" on public.reports;
create policy "Reporters see their own reports"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "Signed-in users report as themselves" on public.reports;
create policy "Signed-in users report as themselves"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and resolved_at is null and resolved_by is null);

revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (target_type, target_id, target_label, reason, details) on public.reports to authenticated;

create or replace function public.enforce_report_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to send a report' using errcode = '42501';
  end if;
  if (
    select count(*) from public.reports
     where reporter_id = auth.uid() and created_at > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'report_limit: You can send up to 10 reports a day' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.reports
     where reporter_id = auth.uid() and target_type = new.target_type and target_id = new.target_id and status = 'open'
  ) then
    raise exception 'report_duplicate: You already reported this and it is waiting for review' using errcode = 'P0001';
  end if;
  new.reporter_id := auth.uid();
  new.status := 'open';
  new.resolution_note := null;
  new.resolved_at := null;
  new.resolved_by := null;
  new.created_at := now();
  new.details := btrim(new.details);
  new.target_label := btrim(new.target_label);
  return new;
end;
$$;

revoke all on function public.enforce_report_limits() from public;

drop trigger if exists a_block_suspended on public.reports;
create trigger a_block_suspended before insert on public.reports
  for each row execute function public.block_suspended_writes();
drop trigger if exists reports_limits on public.reports;
create trigger reports_limits before insert on public.reports
  for each row execute function public.enforce_report_limits();

create or replace function public.admin_resolve_report(target uuid, new_status text, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can close reports' using errcode = '42501';
  end if;
  if new_status not in ('resolved', 'dismissed') then
    raise exception 'Invalid status %', new_status using errcode = '22023';
  end if;
  update public.reports
     set status = new_status,
         resolution_note = nullif(left(btrim(coalesce(note, '')), 280), ''),
         resolved_at = now(),
         resolved_by = auth.uid()
   where id = target and status = 'open';
end;
$$;

revoke all on function public.admin_resolve_report(uuid, text, text) from public;
grant execute on function public.admin_resolve_report(uuid, text, text) to authenticated;

-- 4. Admin removal of a check-in -----------------------------------------------------------------------

create or replace function public.admin_delete_visit(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  visit public.sanctuary_visits%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove check-ins' using errcode = '42501';
  end if;
  select * into visit from public.sanctuary_visits where id = target;
  if not found then
    return;
  end if;
  delete from public.sanctuary_visits where id = target;
  update public.profiles
     set total_focus_minutes = greatest(0, total_focus_minutes - visit.duration_minutes)
   where id = visit.user_id;
end;
$$;

revoke all on function public.admin_delete_visit(uuid) from public;
grant execute on function public.admin_delete_visit(uuid) to authenticated;

-- 5. Saved spots and written reviews on the account ----------------------------------------------------

-- Any spot id the app shows (listings and community spots), so no foreign key to cafes
create table if not exists public.saved_spots (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  spot_id text not null check (char_length(spot_id) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.saved_spots enable row level security;

drop policy if exists "Users manage their own saved spots" on public.saved_spots;
create policy "Users manage their own saved spots"
  on public.saved_spots for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.saved_spots from anon, authenticated;
grant select, delete on public.saved_spots to authenticated;
grant insert (spot_id) on public.saved_spots to authenticated;

create or replace function public.enforce_saved_spot_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  new.created_at := now();
  if (select count(*) from public.saved_spots where user_id = auth.uid()) >= 500 then
    raise exception 'saved_limit: You can save up to 500 spots' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_saved_spot_limit() from public;

drop trigger if exists saved_spots_limit on public.saved_spots;
create trigger saved_spots_limit before insert on public.saved_spots
  for each row execute function public.enforce_saved_spot_limit();

create table if not exists public.spot_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cafe_id text not null check (char_length(cafe_id) between 1 and 120),
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 600),
  author_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cafe_id)
);

create index if not exists spot_reviews_cafe_created_idx on public.spot_reviews (cafe_id, created_at desc);

alter table public.spot_reviews enable row level security;

drop policy if exists "Reviews are public" on public.spot_reviews;
create policy "Reviews are public"
  on public.spot_reviews for select
  using (true);

drop policy if exists "Users write their own review" on public.spot_reviews;
create policy "Users write their own review"
  on public.spot_reviews for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users edit their own review" on public.spot_reviews;
create policy "Users edit their own review"
  on public.spot_reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users and admins remove reviews" on public.spot_reviews;
create policy "Users and admins remove reviews"
  on public.spot_reviews for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Signed-out visitors read reviews without the author's account id
revoke all on public.spot_reviews from anon, authenticated;
grant select (id, cafe_id, rating, body, author_name, created_at, updated_at) on public.spot_reviews to anon;
grant select, delete on public.spot_reviews to authenticated;
grant insert (cafe_id, rating, body) on public.spot_reviews to authenticated;
grant update (rating, body) on public.spot_reviews to authenticated;

create or replace function public.prepare_spot_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.created_at := now();
    if (
      select count(*) from public.spot_reviews
       where user_id = auth.uid() and created_at > now() - interval '24 hours'
    ) >= 20 then
      raise exception 'review_limit: You can post up to 20 reviews a day' using errcode = 'P0001';
    end if;
  end if;
  new.body := btrim(new.body);
  new.updated_at := now();
  new.author_name := coalesce(
    nullif(btrim((select name from public.profiles where id = new.user_id)), ''),
    'Haraya scout'
  );
  return new;
end;
$$;

revoke all on function public.prepare_spot_review() from public;

drop trigger if exists a_block_suspended on public.spot_reviews;
create trigger a_block_suspended before insert or update on public.spot_reviews
  for each row execute function public.block_suspended_writes();
drop trigger if exists prepare_spot_review on public.spot_reviews;
create trigger prepare_spot_review before insert or update on public.spot_reviews
  for each row execute function public.prepare_spot_review();

-- 6. Audit log -----------------------------------------------------------------------------------------

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text not null default '',
  action text not null,
  target_type text not null,
  target_id text not null default '',
  summary text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Admins read the audit log" on public.admin_audit_log;
create policy "Admins read the audit log"
  on public.admin_audit_log for select
  to authenticated
  using (public.is_admin());

-- Written only by the trigger below; no client insert, update or delete
revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;

create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  what text;
  target text;
  note text;
begin
  -- Only changes made by a signed-in admin are logged; everyone else's own edits are not admin actions
  if auth.uid() is null or not public.is_admin() then
    return null;
  end if;

  if tg_table_name = 'cafes' then
    if tg_op = 'INSERT' then
      what := 'place_created'; target := new.id; note := new.name;
    elsif (to_jsonb(new) - 'save_count' - 'view_count') = (to_jsonb(old) - 'save_count' - 'view_count') then
      return null;
    elsif new.status is distinct from old.status then
      what := 'place_' || new.status; target := new.id; note := new.name;
    elsif new.verified is distinct from old.verified then
      what := case when new.verified then 'place_verified' else 'place_unverified' end; target := new.id; note := new.name;
    else
      what := 'place_edited'; target := new.id; note := new.name;
    end if;
  elsif tg_table_name = 'spot_submissions' then
    if new.status is not distinct from old.status then return null; end if;
    what := 'spot_' || new.status; target := new.id::text; note := new.name;
  elsif tg_table_name = 'place_applications' then
    if new.status is not distinct from old.status then return null; end if;
    what := 'application_' || new.status; target := new.id::text; note := new.business_name;
  elsif tg_table_name = 'profiles' then
    if new.role is distinct from old.role then
      what := 'role_changed'; note := new.email || ' is now ' || new.role;
    elsif new.suspended_at is distinct from old.suspended_at then
      what := case when new.suspended_at is null then 'account_restored' else 'account_restricted' end; note := new.email;
    else
      return null;
    end if;
    target := new.id::text;
  elsif tg_table_name = 'sanctuary_visits' then
    -- Removing your own check-in is not moderation
    if old.user_id = auth.uid() then return null; end if;
    what := 'visit_removed'; target := old.id::text; note := old.cafe_name || ', by ' || old.visitor_name;
  elsif tg_table_name = 'spot_reviews' then
    if old.user_id = auth.uid() then return null; end if;
    what := 'review_removed'; target := old.id::text; note := old.cafe_id || ', by ' || old.author_name;
  elsif tg_table_name = 'reports' then
    if new.status is not distinct from old.status then return null; end if;
    what := 'report_' || new.status; target := new.id::text; note := new.target_label;
  else
    return null;
  end if;

  insert into public.admin_audit_log (actor_id, actor_email, action, target_type, target_id, summary)
  values (
    auth.uid(),
    coalesce((select email from public.profiles where id = auth.uid()), ''),
    what,
    tg_table_name,
    coalesce(target, ''),
    left(coalesce(note, ''), 200)
  );
  return null;
end;
$$;

revoke all on function public.audit_admin_change() from public;

drop trigger if exists audit_admin_change on public.cafes;
create trigger audit_admin_change after insert or update on public.cafes
  for each row execute function public.audit_admin_change();
drop trigger if exists audit_admin_change on public.spot_submissions;
create trigger audit_admin_change after update on public.spot_submissions
  for each row execute function public.audit_admin_change();
drop trigger if exists audit_admin_change on public.place_applications;
create trigger audit_admin_change after update on public.place_applications
  for each row execute function public.audit_admin_change();
drop trigger if exists audit_admin_change on public.profiles;
create trigger audit_admin_change after update on public.profiles
  for each row execute function public.audit_admin_change();
drop trigger if exists audit_admin_change on public.sanctuary_visits;
create trigger audit_admin_change after delete on public.sanctuary_visits
  for each row execute function public.audit_admin_change();
drop trigger if exists audit_admin_change on public.spot_reviews;
create trigger audit_admin_change after delete on public.spot_reviews
  for each row execute function public.audit_admin_change();
drop trigger if exists audit_admin_change on public.reports;
create trigger audit_admin_change after update on public.reports
  for each row execute function public.audit_admin_change();

-- 7. Notifications -------------------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users read their own notifications" on public.notifications;
create policy "Users read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users mark their own notifications read" on public.notifications;
create policy "Users mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Written only by the trigger below; users may set read_at and nothing else
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.notify_on_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  visit_owner uuid;
  place text;
begin
  if tg_table_name = 'spot_submissions' then
    if new.status is not distinct from old.status or new.status = 'pending' then return null; end if;
    insert into public.notifications (user_id, kind, title, body, link)
    values (
      new.submitted_by,
      'spot_' || new.status,
      case when new.status = 'approved' then 'Your spot is live' else 'Your spot was not added' end,
      new.name || coalesce('. ' || nullif(new.review_note, ''), ''),
      case when new.status = 'approved' then '#/cafe/spot-' || new.id::text else '#/tab/submit' end
    );
  elsif tg_table_name = 'place_applications' then
    if new.status is not distinct from old.status or new.status = 'pending' then return null; end if;
    insert into public.notifications (user_id, kind, title, body, link)
    values (
      new.owner_id,
      'application_' || new.status,
      case when new.status = 'approved' then 'Your place is listed' else 'Your application was not approved' end,
      new.business_name || coalesce('. ' || nullif(new.review_note, ''), ''),
      '#/tab/portal'
    );
  elsif tg_table_name = 'reports' then
    if new.status is not distinct from old.status or new.status = 'open' then return null; end if;
    insert into public.notifications (user_id, kind, title, body, link)
    values (
      new.reporter_id,
      'report_' || new.status,
      'Your report was reviewed',
      coalesce(nullif(new.target_label, ''), 'Thank you for the report') || coalesce('. ' || nullif(new.resolution_note, ''), ''),
      ''
    );
  elsif tg_table_name = 'cup_clinks' then
    select v.user_id, v.cafe_name into visit_owner, place from public.sanctuary_visits v where v.id = new.visit_id;
    if visit_owner is null or visit_owner = new.user_id then return null; end if;
    insert into public.notifications (user_id, kind, title, body, link)
    values (visit_owner, 'clink', 'Someone clinked your visit', coalesce(place, ''), '#/tab/profile');
  end if;
  return null;
end;
$$;

revoke all on function public.notify_on_change() from public;

drop trigger if exists notify_on_change on public.spot_submissions;
create trigger notify_on_change after update on public.spot_submissions
  for each row execute function public.notify_on_change();
drop trigger if exists notify_on_change on public.place_applications;
create trigger notify_on_change after update on public.place_applications
  for each row execute function public.notify_on_change();
drop trigger if exists notify_on_change on public.reports;
create trigger notify_on_change after update on public.reports
  for each row execute function public.notify_on_change();
drop trigger if exists notify_on_change on public.cup_clinks;
create trigger notify_on_change after insert on public.cup_clinks
  for each row execute function public.notify_on_change();

-- 8. Client error reports and anonymous usage events ----------------------------------------------------

create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid,
  message text not null check (char_length(message) between 1 and 500),
  stack text not null default '' check (char_length(stack) <= 2000),
  page text not null default '' check (char_length(page) <= 200),
  user_agent text not null default '' check (char_length(user_agent) <= 300),
  app_version text not null default '' check (char_length(app_version) <= 40)
);

create index if not exists client_errors_created_idx on public.client_errors (created_at desc);

-- No account id, no IP address, no device id: a name and one short detail
create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (name in ('search_no_results', 'city_empty', 'tab_view')),
  detail text not null default '' check (char_length(detail) <= 80)
);

create index if not exists app_events_created_idx on public.app_events (created_at desc);
create index if not exists app_events_name_idx on public.app_events (name, created_at desc);

alter table public.client_errors enable row level security;
alter table public.app_events enable row level security;

drop policy if exists "Anyone can report an error" on public.client_errors;
create policy "Anyone can report an error" on public.client_errors for insert to anon, authenticated with check (true);
drop policy if exists "Admins read error reports" on public.client_errors;
create policy "Admins read error reports" on public.client_errors for select to authenticated using (public.is_admin());
drop policy if exists "Admins clear error reports" on public.client_errors;
create policy "Admins clear error reports" on public.client_errors for delete to authenticated using (public.is_admin());

drop policy if exists "Anyone can record a usage event" on public.app_events;
create policy "Anyone can record a usage event" on public.app_events for insert to anon, authenticated with check (true);
drop policy if exists "Admins read usage events" on public.app_events;
create policy "Admins read usage events" on public.app_events for select to authenticated using (public.is_admin());

revoke all on public.client_errors from anon, authenticated;
revoke all on public.app_events from anon, authenticated;
grant insert (message, stack, page, user_agent, app_version) on public.client_errors to anon, authenticated;
grant select, delete on public.client_errors to authenticated;
grant insert (name, detail) on public.app_events to anon, authenticated;
grant select on public.app_events to authenticated;

-- Open inserts need a ceiling: past the hourly cap a row is dropped quietly. Old rows are pruned as new ones arrive.
create or replace function public.cap_telemetry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_at := now();
  if tg_table_name = 'client_errors' then
    new.user_id := auth.uid();
    if (select count(*) from public.client_errors where created_at > now() - interval '1 hour') >= 300 then
      return null;
    end if;
    if random() < 0.02 then
      delete from public.client_errors where created_at < now() - interval '30 days';
    end if;
  else
    if (select count(*) from public.app_events where created_at > now() - interval '1 hour') >= 3000 then
      return null;
    end if;
    if random() < 0.02 then
      delete from public.app_events where created_at < now() - interval '90 days';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.cap_telemetry() from public;

drop trigger if exists cap_telemetry on public.client_errors;
create trigger cap_telemetry before insert on public.client_errors
  for each row execute function public.cap_telemetry();
drop trigger if exists cap_telemetry on public.app_events;
create trigger cap_telemetry before insert on public.app_events
  for each row execute function public.cap_telemetry();

create or replace function public.admin_event_summary(since_days integer default 30)
returns table (name text, detail text, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can read usage' using errcode = '42501';
  end if;
  return query
    select e.name, e.detail, count(*)::bigint as total
      from public.app_events e
     where e.created_at > now() - make_interval(days => least(greatest(since_days, 1), 90))
     group by e.name, e.detail
     order by total desc
     limit 200;
end;
$$;

revoke all on function public.admin_event_summary(integer) from public;
grant execute on function public.admin_event_summary(integer) to authenticated;

-- 9. Account deletion ----------------------------------------------------------------------------------

-- Removes the caller's sign-in. Rows that reference it (profile, check-ins, saved spots, reviews, reports,
-- notifications, and the spots they submitted) go with it through their foreign keys.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if public.is_admin() and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'last_admin: Make another account an admin before deleting this one' using errcode = 'P0001';
  end if;
  -- Reviews this account made as an admin stay, without pointing at a deleted sign-in
  update public.spot_submissions set reviewed_by = null where reviewed_by = auth.uid();
  update public.place_applications set reviewed_by = null where reviewed_by = auth.uid();
  update public.reports set resolved_by = null where resolved_by = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- 10. Listing stats for the owner -----------------------------------------------------------------------

create or replace function public.listing_stats(target text)
returns table (visits_total bigint, visits_30d bigint, focus_minutes_30d bigint, reviews_total bigint, rating_average numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (
    public.is_admin()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.cafe_profile_id = target)
  ) then
    raise exception 'Only the owner can read these numbers' using errcode = '42501';
  end if;
  return query
    select
      (select count(*) from public.sanctuary_visits v where v.cafe_id = target)::bigint,
      (select count(*) from public.sanctuary_visits v where v.cafe_id = target and v.created_at > now() - interval '30 days')::bigint,
      (select coalesce(sum(v.duration_minutes), 0) from public.sanctuary_visits v
        where v.cafe_id = target and v.session_type = 'focus' and v.created_at > now() - interval '30 days')::bigint,
      (select count(*) from public.spot_reviews r where r.cafe_id = target)::bigint,
      (select round(avg(r.rating), 1) from public.spot_reviews r where r.cafe_id = target);
end;
$$;

revoke all on function public.listing_stats(text) from public;
grant execute on function public.listing_stats(text) to authenticated;

-- 11. Place photos --------------------------------------------------------------------------------------

-- Public bucket: files are read through their public link. Each listing keeps its photos under a folder
-- named after its id, and only that listing's owner or an admin may add or remove files there.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners and admins add place photos" on storage.objects;
create policy "Owners and admins add place photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'place-photos'
    and not public.is_suspended()
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = (select p.cafe_profile_id from public.profiles p where p.id = auth.uid())
    )
  );

drop policy if exists "Owners and admins remove place photos" on storage.objects;
create policy "Owners and admins remove place photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'place-photos'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = (select p.cafe_profile_id from public.profiles p where p.id = auth.uid())
    )
  );
