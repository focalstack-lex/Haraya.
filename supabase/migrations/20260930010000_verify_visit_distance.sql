-- Check-ins: the database now measures the distance itself, and Cup Clinks get a rate limit.
--
-- Before this, verified_distance_meters was whatever the device sent (bounded 0 to 150), so a visit to any
-- spot could be logged from anywhere. Catalog spots have been stored in public.cafes since
-- 20260929040000_seed_catalog_cafes.sql and community spots live in public.spot_submissions, so the
-- coordinates of every spot the app can show are now known server side.
--
-- Still a known limit: a device that lies about its own GPS position passes. That cannot be fixed in SQL.
--
-- Safe to run more than once. Depends on 20260929030000_sanctuary_visits.sql.

-- 1. Distance is recomputed from the reported position and the spot's stored coordinates ----------------

create or replace function public.prepare_sanctuary_visit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  spot_lat double precision;
  spot_lng double precision;
  meters double precision;
begin
  select c.lat, c.lng into spot_lat, spot_lng from public.cafes c where c.id = new.cafe_id;

  -- Community spots are shown in the app as 'spot-<submission id>'
  if spot_lat is null and new.cafe_id like 'spot-%' then
    select s.lat, s.lng into spot_lat, spot_lng
      from public.spot_submissions s
     where s.id::text = substr(new.cafe_id, 6) and s.status = 'approved';
  end if;

  if spot_lat is null then
    raise exception 'visit_unknown_spot: This spot cannot take check-ins yet' using errcode = 'P0001';
  end if;

  -- Haversine, in meters
  meters := 2 * 6371000 * asin(sqrt(
    power(sin(radians(spot_lat - new.user_lat) / 2), 2)
    + cos(radians(new.user_lat)) * cos(radians(spot_lat)) * power(sin(radians(spot_lng - new.user_lng) / 2), 2)
  ));

  if meters > 150 then
    raise exception 'visit_too_far: You need to be at the spot to check in' using errcode = 'P0001';
  end if;

  new.verified_distance_meters := round(meters::numeric, 2);
  new.visitor_name := coalesce(
    nullif(btrim((select name from public.profiles where id = new.user_id)), ''),
    'Haraya scout'
  );
  new.clinks_count := 0;
  new.created_at := now();
  return new;
end;
$$;

revoke all on function public.prepare_sanctuary_visit() from public;

-- 2. Sixty Cup Clinks per user per rolling hour --------------------------------------------------------

create or replace function public.check_clink_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.cup_clinks
     where user_id = new.user_id and created_at >= now() - interval '1 hour'
  ) >= 60 then
    raise exception 'clink_limit: Too many Cup Clinks, try again later' using errcode = 'P0001';
  end if;
  new.created_at := now();
  return new;
end;
$$;

revoke all on function public.check_clink_rate_limit() from public;

drop trigger if exists trg_check_clink_rate_limit on public.cup_clinks;
create trigger trg_check_clink_rate_limit
  before insert on public.cup_clinks
  for each row execute function public.check_clink_rate_limit();

-- 3. Signed-out visitors no longer read who clinked (the count on the visit is enough for them) ----------

revoke select on public.cup_clinks from anon;
grant select (id, visit_id, created_at) on public.cup_clinks to anon;
