-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.rides enable row level security;
alter table public.ride_participants enable row level security;
alter table public.groups enable row level security;
alter table public.user_group enable row level security;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Anyone authenticated can view all users (for displaying names/avatars)
create policy "users_select_authenticated"
on public.users for select
to authenticated
using (true);

-- Users can only update their own profile
create policy "users_update_own"
on public.users for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Users can insert their own profile (for signup)
create policy "users_insert_own"
on public.users for insert
to authenticated
with check ((select auth.uid()) = id);

-- ============================================
-- RIDES TABLE POLICIES
-- ============================================

-- Anyone authenticated can view all rides
create policy "rides_select_authenticated"
on public.rides for select
to authenticated
using (true);

-- Authenticated users can create rides (as themselves)
create policy "rides_insert_authenticated"
on public.rides for insert
to authenticated
with check ((select auth.uid()) = created_by);

-- Only the creator can update their ride
create policy "rides_update_creator"
on public.rides for update
to authenticated
using ((select auth.uid()) = created_by)
with check ((select auth.uid()) = created_by);

-- Only the creator can delete their ride
create policy "rides_delete_creator"
on public.rides for delete
to authenticated
using ((select auth.uid()) = created_by);

-- ============================================
-- RIDE_PARTICIPANTS TABLE POLICIES
-- ============================================

-- Anyone authenticated can view all participants
create policy "ride_participants_select_authenticated"
on public.ride_participants for select
to authenticated
using (true);

-- Users can join rides (insert their own participation)
create policy "ride_participants_insert_own"
on public.ride_participants for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Users can leave rides (delete their own participation)
create policy "ride_participants_delete_own"
on public.ride_participants for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Users can update their own participation status
create policy "ride_participants_update_own"
on public.ride_participants for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- ============================================
-- GROUPS TABLE POLICIES
-- ============================================

-- Anyone authenticated can view all groups
create policy "groups_select_authenticated"
on public.groups for select
to authenticated
using (true);

-- Only admins can create groups
create policy "groups_insert_admin"
on public.groups for insert
to authenticated
with check (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
    and is_admin = true
  )
);

-- Only admins can update groups
create policy "groups_update_admin"
on public.groups for update
to authenticated
using (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
    and is_admin = true
  )
);

-- Only admins can delete groups
create policy "groups_delete_admin"
on public.groups for delete
to authenticated
using (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
    and is_admin = true
  )
);

-- ============================================
-- USER_GROUP TABLE POLICIES
-- ============================================

-- Anyone authenticated can view group memberships
create policy "user_group_select_authenticated"
on public.user_group for select
to authenticated
using (true);

-- Users can join groups (insert their own membership)
create policy "user_group_insert_own"
on public.user_group for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Users can leave groups (delete their own membership)
create policy "user_group_delete_own"
on public.user_group for delete
to authenticated
using ((select auth.uid()) = user_id);
