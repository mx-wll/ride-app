-- Initial schema for ride-app

-- Users table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  full_name text,
  avatar_url text,
  social_url text,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Groups table
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now()
);

-- User-group relationship
create table if not exists public.user_group (
  user_id uuid references public.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  primary key (user_id, group_id)
);

-- Rides table
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_location text,
  ride_time timestamp with time zone not null,
  distance integer not null,
  pace text,
  bike_type text,
  created_by uuid references public.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Ride participants
create table if not exists public.ride_participants (
  ride_id uuid references public.rides(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now(),
  primary key (ride_id, user_id)
);

-- Create indexes
create index if not exists idx_rides_created_by on public.rides(created_by);
create index if not exists idx_rides_ride_time on public.rides(ride_time);
create index if not exists idx_ride_participants_user on public.ride_participants(user_id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for users updated_at
drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();
