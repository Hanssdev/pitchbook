-- PitchBook Database Schema
-- Run this in your Supabase SQL editor

-- Enums
create type user_role as enum ('owner', 'player');
create type reservation_status as enum ('pending', 'confirmed', 'cancelled');

-- Users
-- Synced from Clerk via webhook or server action on first login
create table if not exists users (
  id          text primary key,         -- Clerk user ID
  role        user_role not null,
  name        text not null,
  email       text not null unique,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Fields (owned by owners)
create table if not exists fields (
  id              uuid primary key default gen_random_uuid(),
  owner_id        text not null references users(id) on delete cascade,
  name            text not null,
  location        text not null,
  price_per_hour  numeric(10, 2) not null check (price_per_hour > 0),
  photos          text[] not null default '{}',
  schedule        jsonb not null default '{"days": []}',
  created_at      timestamptz not null default now()
);

create index if not exists fields_owner_id_idx on fields(owner_id);

-- Reservations
create table if not exists reservations (
  id          uuid primary key default gen_random_uuid(),
  field_id    uuid not null references fields(id) on delete cascade,
  player_id   text not null references users(id) on delete cascade,
  date        date not null,
  time_block  text not null,            -- e.g. "18:00-19:00"
  status      reservation_status not null default 'pending',
  share_slug  text not null unique,     -- short unique slug for sharing
  created_at  timestamptz not null default now(),
  -- Prevent double-booking the same field/date/time_block
  unique (field_id, date, time_block)
);

create index if not exists reservations_field_id_idx on reservations(field_id);
create index if not exists reservations_player_id_idx on reservations(player_id);
create index if not exists reservations_date_idx on reservations(date);

-- Players who join a reservation (team lineup)
create table if not exists reservation_players (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references reservations(id) on delete cascade,
  player_id       text not null references users(id) on delete cascade,
  position        text,                 -- e.g. "GK", "CB", "ST"
  joined_at       timestamptz not null default now(),
  unique (reservation_id, player_id)
);

create index if not exists reservation_players_reservation_id_idx on reservation_players(reservation_id);
create index if not exists reservation_players_player_id_idx on reservation_players(player_id);

-- Row Level Security
alter table users enable row level security;
alter table fields enable row level security;
alter table reservations enable row level security;
alter table reservation_players enable row level security;

-- RLS Policies: users
create policy "Users can view their own profile"
  on users for select using (auth.uid()::text = id);

create policy "Users can update their own profile"
  on users for update using (auth.uid()::text = id);

-- RLS Policies: fields
create policy "Anyone can view fields"
  on fields for select using (true);

create policy "Owners can insert their fields"
  on fields for insert with check (auth.uid()::text = owner_id);

create policy "Owners can update their fields"
  on fields for update using (auth.uid()::text = owner_id);

create policy "Owners can delete their fields"
  on fields for delete using (auth.uid()::text = owner_id);

-- RLS Policies: reservations
create policy "Players can view their reservations"
  on reservations for select using (auth.uid()::text = player_id);

create policy "Field owners can view reservations for their fields"
  on reservations for select using (
    exists (
      select 1 from fields
      where fields.id = reservations.field_id
        and fields.owner_id = auth.uid()::text
    )
  );

create policy "Players can create reservations"
  on reservations for insert with check (auth.uid()::text = player_id);

create policy "Players can cancel their reservations"
  on reservations for update using (auth.uid()::text = player_id);

create policy "Owners can confirm or cancel reservations"
  on reservations for update using (
    exists (
      select 1 from fields
      where fields.id = reservations.field_id
        and fields.owner_id = auth.uid()::text
    )
  );

-- RLS Policies: reservation_players
create policy "Anyone can view reservation players"
  on reservation_players for select using (true);

create policy "Players can join a reservation"
  on reservation_players for insert with check (auth.uid()::text = player_id);

create policy "Players can leave a reservation"
  on reservation_players for delete using (auth.uid()::text = player_id);
