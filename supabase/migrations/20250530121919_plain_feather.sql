-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enable PostGIS for location queries
create extension if not exists postgis;

-- Create league tier enum
create type public.league_tier as enum ('BRONZE', 'SILVER', 'GOLD');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) >= 2),
  avatar_url text,
  fav_club text not null,
  skill_level int not null check (skill_level between 1 and 5),
  home_county text not null,
  lat double precision,
  lon double precision,
  expo_push_token text,
  created_at timestamptz default now()
);

-- Create match games table
create table public.match_games (
  id uuid primary key default uuid_generate_v4(),
  organiser_id uuid references profiles(id) not null,
  title text not null check (char_length(title) >= 5),
  venue text not null check (char_length(venue) >= 5),
  lat double precision not null,
  lon double precision not null,
  game_date timestamptz not null,
  fee_cents int not null check (fee_cents >= 0),
  capacity int not null check (capacity between 2 and 22),
  status text default 'OPEN' check (status in ('OPEN', 'FULL', 'CANCELLED')),
  created_at timestamptz default now()
);

-- Create player_on_game table
create table public.player_on_game (
  game_id uuid references match_games(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (game_id, user_id)
);

-- Create teams table
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null check (char_length(name) >= 3),
  manager_id uuid references profiles(id) not null,
  colours text not null,
  league_tier league_tier default 'BRONZE',
  created_at timestamptz default now()
);

-- Create likes table
create table public.likes (
  id uuid primary key default uuid_generate_v4(),
  from_id uuid references profiles(id) on delete cascade,
  to_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (from_id, to_id)
);

-- Create chats table
create table public.chats (
  id uuid primary key default uuid_generate_v4(),
  is_group boolean default false,
  created_at timestamptz default now()
);

-- Create messages table
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text not null check (char_length(body) >= 1),
  sent_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

alter table match_games enable row level security;
create policy "Games are viewable by everyone"
  on match_games for select
  using (true);
create policy "Authenticated users can create games"
  on match_games for insert
  with check (auth.uid() = organiser_id);
create policy "Organisers can update their games"
  on match_games for update
  using (auth.uid() = organiser_id);

alter table player_on_game enable row level security;
create policy "Players can view game rosters"
  on player_on_game for select
  using (true);
create policy "Players can join/leave games"
  on player_on_game for insert
  with check (auth.uid() = user_id);
create policy "Players can leave games"
  on player_on_game for delete
  using (auth.uid() = user_id);

-- Function to list nearby games
create or replace function public.list_nearby_games(
  lat double precision,
  lon double precision,
  radius_km double precision
)
returns setof match_games
language sql
security definer
set search_path = public
stable
as $$
  select *
  from match_games
  where status = 'OPEN'
    and ST_DWithin(
      ST_MakePoint(lon, lat)::geography,
      ST_MakePoint($2, $1)::geography,
      $3 * 1000
    )
  order by game_date asc;
$$;