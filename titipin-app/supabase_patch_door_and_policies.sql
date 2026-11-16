-- ============================================================
--  TITIPIN — Supabase Patch: is_door_open & Demo Public RLS
--  Run this script in Supabase SQL Editor -> "Run"
-- ============================================================

-- 1. Add is_door_open column to lockers table
alter table public.lockers 
  add column if not exists is_door_open boolean not null default false;

-- 2. Make user_id nullable on bookings & transactions for guest/demo checkout
alter table public.bookings 
  alter column user_id drop not null;

alter table public.transactions 
  alter column user_id drop not null;

-- 3. Update RLS on lockers so demo app can update status & is_door_open
drop policy if exists "lockers: service write" on public.lockers;
drop policy if exists "lockers: public update" on public.lockers;
create policy "lockers: public update" on public.lockers
  for update using (true) with check (true);

-- 4. Update RLS on bookings for public/demo insert & select
drop policy if exists "bookings: own rows" on public.bookings;
drop policy if exists "bookings: public read" on public.bookings;
drop policy if exists "bookings: public insert" on public.bookings;
drop policy if exists "bookings: public update" on public.bookings;
create policy "bookings: public read" on public.bookings for select using (true);
create policy "bookings: public insert" on public.bookings for insert with check (true);
create policy "bookings: public update" on public.bookings for update using (true);

-- 5. Update RLS on transactions for public/demo insert & select
drop policy if exists "transactions: own rows" on public.transactions;
drop policy if exists "transactions: public read" on public.transactions;
drop policy if exists "transactions: public insert" on public.transactions;
create policy "transactions: public read" on public.transactions for select using (true);
create policy "transactions: public insert" on public.transactions for insert with check (true);

-- 6. Ensure full row replication for Realtime WebSocket events
alter table public.lockers replica identity full;
alter table public.bookings replica identity full;

-- Refresh schema cache notification
notify pgrst, 'reload schema';
