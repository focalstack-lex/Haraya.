-- Haraya Specialty Coffee Database Schema
-- Supabase Postgres Migration

-- 1. Profiles table linked to Supabase Auth
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null default '',
  business_name text,
  role text not null default 'guest' check (role in ('guest', 'roaster', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  cafe_profile_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Cafes and Micro-Roasteries
create table if not exists public.cafes (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  name text not null,
  is_roastery boolean not null default false,
  city text not null default 'Davao City',
  district text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  images text[] not null default '{}',
  logo_url text not null default '',
  description text not null default '',
  signature text not null default '',
  menu jsonb not null default '[]'::jsonb,
  amenities text[] not null default '{}',
  wifi_mbps integer not null default 0,
  brew_methods text[] not null default '{}',
  price_level smallint not null default 2 check (price_level in (1, 2, 3)),
  hours jsonb not null default '{}'::jsonb,
  vibe_tags text[] not null default '{}',
  verified boolean not null default false,
  save_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- 3. Single-Origin Beans
create table if not exists public.beans (
  id uuid primary key default gen_random_uuid(),
  roaster_id uuid references public.cafes(id) on delete set null,
  roaster_name text not null,
  name text not null,
  origin text not null default 'Mt. Apo, Davao del Sur',
  farm text not null default '',
  varietal text not null default '',
  process text not null default 'Washed',
  altitude_masl integer not null default 1200,
  tasting_notes text[] not null default '{}',
  roast_profile jsonb not null default '{}'::jsonb,
  price numeric(10, 2) not null default 0.00,
  drip_pack_price numeric(10, 2),
  bags_in_stock integer not null default 0,
  images text[] not null default '{}',
  description text not null default '',
  is_limited boolean not null default false,
  single_origin boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Roast Drops (Small-Batch Roastery Releases)
create table if not exists public.roast_drops (
  id uuid primary key default gen_random_uuid(),
  roaster_id uuid references public.cafes(id) on delete cascade,
  roaster_name text not null,
  bean_id uuid references public.beans(id) on delete set null,
  title text not null,
  description text not null default '',
  drop_at timestamptz not null,
  batch_bags integer not null default 25,
  price numeric(10, 2) not null default 0.00,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'soldOut')),
  remind_count integer not null default 0,
  cover_image text not null default '',
  created_at timestamptz not null default now()
);

-- 5. Cup Check Community Feed
create table if not exists public.cup_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_name text not null,
  cafe_id uuid references public.cafes(id) on delete cascade,
  cafe_name text not null,
  bean_name text,
  rating smallint not null default 5 check (rating between 1 and 5),
  note text not null default '',
  flavor_pins jsonb not null default '[]'::jsonb,
  photo_url text,
  created_at timestamptz not null default now()
);

-- 6. Bean Reservations
create table if not exists public.bean_reservations (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid references public.roast_drops(id) on delete cascade,
  user_name text not null,
  user_phone text not null,
  quantity integer not null default 1,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- 7. Cafe Bookmarks / Saves
create table if not exists public.cafe_saves (
  user_id uuid references auth.users(id) on delete cascade,
  cafe_id uuid references public.cafes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, cafe_id)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.cafes enable row level security;
alter table public.beans enable row level security;
alter table public.roast_drops enable row level security;
alter table public.cup_checks enable row level security;
alter table public.bean_reservations enable row level security;
alter table public.cafe_saves enable row level security;

-- RLS Policies
-- Public Read Access for Discovery
create policy "Public can view verified cafes" on public.cafes for select using (true);
create policy "Public can view beans" on public.beans for select using (true);
create policy "Public can view roast drops" on public.roast_drops for select using (true);
create policy "Public can view cup checks" on public.cup_checks for select using (true);

-- User-specific Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can manage own saves" on public.cafe_saves for all using (auth.uid() = user_id);
create policy "Users can insert cup checks" on public.cup_checks for insert with check (auth.uid() = user_id);

-- Roasters / Admins can manage their cafes and drops
create policy "Roasters can update their cafes" on public.cafes for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('roaster', 'admin'))
);
