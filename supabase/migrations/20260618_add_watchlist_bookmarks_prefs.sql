-- ─────────────────────────────────────────────────────────────────────────────
-- CoFund  |  Watchlist · Post Bookmarks · Investor & Notification Preferences
-- Apply in Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. user_watchlist ────────────────────────────────────────────────────────
--   Stores opportunities or businesses a user wants to track.
create table if not exists public.user_watchlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     uuid not null,
  item_type   text not null check (item_type in ('opportunity', 'business')),
  created_at  timestamptz not null default now()
);

alter table public.user_watchlist enable row level security;

-- Prevent duplicate watchlist entries
create unique index if not exists user_watchlist_unique_idx
  on public.user_watchlist (user_id, item_id, item_type);

-- Users can only see and manage their own watchlist
create policy "user_watchlist: own rows only"
  on public.user_watchlist for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 2. post_bookmarks ────────────────────────────────────────────────────────
--   Stores community posts a user has bookmarked.
create table if not exists public.post_bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  post_id     uuid not null references public.posts(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.post_bookmarks enable row level security;

create unique index if not exists post_bookmarks_unique_idx
  on public.post_bookmarks (user_id, post_id);

create policy "post_bookmarks: own rows only"
  on public.post_bookmarks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 3. investor_preferences ──────────────────────────────────────────────────
--   One row per investor — preferred industries, risk level, and ticket size.
create table if not exists public.investor_preferences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique not null references auth.users(id) on delete cascade,
  industries  text[]       not null default '{}',
  risk_level  text         not null default 'moderate',
  min_ticket  text         not null default '₦100,000',
  updated_at  timestamptz  not null default now()
);

alter table public.investor_preferences enable row level security;

create policy "investor_preferences: own rows only"
  on public.investor_preferences for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 4. notification_preferences ──────────────────────────────────────────────
--   One row per user — toggles for each notification channel.
create table if not exists public.notification_preferences (
  id                  uuid    primary key default gen_random_uuid(),
  user_id             uuid    unique not null references auth.users(id) on delete cascade,
  new_deals           boolean not null default true,
  investment_updates  boolean not null default true,
  community_activity  boolean not null default false,
  security_alerts     boolean not null default true,
  marketing_emails    boolean not null default false,
  updated_at          timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences: own rows only"
  on public.notification_preferences for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 5. updated_at triggers ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists investor_preferences_set_updated_at on public.investor_preferences;
create trigger investor_preferences_set_updated_at
  before update on public.investor_preferences
  for each row execute procedure public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute procedure public.set_updated_at();
