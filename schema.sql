-- ─────────────────────────────────────────────────────────────────────────────
-- FLŌW · Supabase Database Schema  v2
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. POSTS ─────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  caption       text not null default '',
  platforms     text[] not null default '{}',
  hashtags      text[] not null default '{}',
  scheduled_at  timestamptz,
  status        text not null default 'draft'
                  check (status in ('draft','scheduled','review','posted')),
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.posts enable row level security;

drop policy if exists "Users manage own posts" on public.posts;
create policy "Users manage own posts" on public.posts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure public.handle_updated_at();

-- ── 2. ANALYTICS SNAPSHOTS ───────────────────────────────────────────────────
create table if not exists public.analytics_snapshots (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  platform        text not null
                    check (platform in ('ig','tw','tk','li','yt','fb','sc')),
  followers       integer default 0,
  following       integer default 0,
  posts_count     integer default 0,
  engagement_rate float  default 0,
  avg_likes       integer default 0,
  avg_comments    integer default 0,
  avg_shares      integer default 0,
  avg_views       integer default 0,
  watch_time_hrs  integer default 0,
  story_views     integer default 0,
  snap_score      integer default 0,
  page_reach      integer default 0,
  growth_7d       integer default 0,
  growth_30d      integer default 0,
  recorded_at     timestamptz default now(),
  unique (user_id, platform)
);

alter table public.analytics_snapshots enable row level security;

drop policy if exists "Users manage own analytics" on public.analytics_snapshots;
create policy "Users manage own analytics" on public.analytics_snapshots
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. PLATFORM CONNECTIONS ──────────────────────────────────────────────────
create table if not exists public.platform_connections (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  platform          text not null
                      check (platform in ('ig','tw','tk','li','yt','fb','sc')),
  username          text,
  platform_user_id  text,
  access_token      text,
  refresh_token     text,
  token_expires     timestamptz,
  connected_at      timestamptz default now(),
  unique (user_id, platform)
);

alter table public.platform_connections enable row level security;

drop policy if exists "Users manage own connections" on public.platform_connections;
create policy "Users manage own connections" on public.platform_connections
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 4. SAVED IDEAS ───────────────────────────────────────────────────────────
create table if not exists public.saved_ideas (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text,
  title       text not null,
  description text,
  tags        text[] default '{}',
  platforms   text[] default '{}',
  used        boolean default false,
  created_at  timestamptz default now()
);

alter table public.saved_ideas enable row level security;

drop policy if exists "Users manage own ideas" on public.saved_ideas;
create policy "Users manage own ideas" on public.saved_ideas
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 5. USER PROFILES (display name, brand info) ──────────────────────────────
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  full_name     text,
  brand_name    text,
  niche         text,
  avatar_url    text,
  updated_at    timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
