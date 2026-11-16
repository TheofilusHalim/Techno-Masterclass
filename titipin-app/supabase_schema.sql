-- ============================================================
--  TITIPIN — Smart Digital Locker Ecosystem
--  Supabase Schema v2.0
--  Hardware Blueprint: ESP32-S3 + TFT LCD + Camera (QR Scan)
--  Access Flow: HP scans QR on locker LCD  |  Remote Unlock via app
--  Run this entire file in Supabase SQL Editor → "Run"
-- ============================================================

-- ─────────────────────────────────────────
--  EXTENSIONS
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ─────────────────────────────────────────
--  ENUM TYPES
-- ─────────────────────────────────────────
do $$ begin
  create type locker_size   as enum ('S', 'M', 'L');
exception when duplicate_object then null; end $$;

do $$ begin
  create type locker_status as enum ('available', 'occupied', 'unlocked', 'maintenance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('active', 'extended', 'finished', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_type   as enum ('per_hour', 'subscription');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('qris', 'ewallet', 'virtual_account');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hub_category   as enum ('campus', 'station', 'mall', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notif_type     as enum ('warning', 'success', 'info');
exception when duplicate_object then null; end $$;


-- ─────────────────────────────────────────
--  TABLE: profiles
--  One row per auth.users entry.
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text not null default 'User',
  email             text,
  has_monthly_plan  boolean not null default false,
  plan_expires_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────────────────────────────────
--  TABLE: hubs
--  Physical locker hub locations.
-- ─────────────────────────────────────────
create table if not exists public.hubs (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  sub_location text,
  category     hub_category not null default 'other',
  address      text,
  lat          double precision,
  lng          double precision,
  distance_km  numeric(5,2),   -- from demo reference point (UK Petra)
  walk_minutes int,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);


-- ─────────────────────────────────────────
--  TABLE: lockers
--  Individual locker units inside a hub.
--  REALTIME is enabled on this table (see bottom).
-- ─────────────────────────────────────────
create table if not exists public.lockers (
  id              uuid primary key default uuid_generate_v4(),
  hub_id          uuid not null references public.hubs(id) on delete cascade,
  locker_number   text not null,            -- e.g. "M-07"
  size            locker_size not null,
  status          locker_status not null default 'available',

  -- Hardware identity (ESP32-S3 blueprint)
  -- The QR payload rendered on the TFT LCD of this locker.
  -- Format: TITIPIN:<HUB_CODE>:<LOCKER_NUMBER>
  -- The user's phone camera scans this static QR; the app then
  -- calls the Remote Unlock API — no PIN keypad required.
  qr_payload      text,                     -- e.g. "TITIPIN:UK_PETRA:M-07"

  -- RFID fallback tag UID (backup access method)
  rfid_uid        text,                     -- e.g. "A3:F2:9C:11"

  -- Physical door state (true = unlocked/open for 5s, false = locked)
  is_door_open    boolean not null default false,

  -- Current booking that has this locker occupied
  current_booking_id  uuid,                 -- FK set after insert on bookings

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (hub_id, locker_number)
);


-- ─────────────────────────────────────────
--  TABLE: bookings
--  One active booking = one locker rental session.
-- ─────────────────────────────────────────
create table if not exists public.bookings (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  locker_id       uuid not null references public.lockers(id),
  hub_id          uuid not null references public.hubs(id),

  status          booking_status not null default 'active',
  payment_type    payment_type not null,

  -- Timing
  started_at      timestamptz not null default now(),
  expires_at      timestamptz not null,              -- computed: started_at + duration
  finished_at     timestamptz,

  -- Pricing
  hours_booked    int not null default 1,            -- 0 for subscription
  amount_paid     int not null,                      -- in IDR (integer, no decimals)
  payment_method  payment_method not null default 'qris',

  -- Access credentials (v2 hardware blueprint)
  -- Static QR is on the locker LCD; app uses booking_token for Remote Unlock API.
  booking_token   text not null default encode(gen_random_bytes(16), 'hex'),
  rfid_uid        text,       -- mirrored from locker for quick lookup

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Back-fill cross-reference: when a booking is created, lock the locker
create or replace function public.lock_locker_on_booking()
returns trigger language plpgsql security definer as $$
begin
  update public.lockers
  set
    status             = 'occupied',
    current_booking_id = new.id,
    updated_at         = now()
  where id = new.locker_id;
  return new;
end;
$$;

drop trigger if exists on_booking_created on public.bookings;
create trigger on_booking_created
  after insert on public.bookings
  for each row execute function public.lock_locker_on_booking();

-- Release locker when booking finishes/cancels
create or replace function public.release_locker_on_booking_end()
returns trigger language plpgsql security definer as $$
begin
  if new.status in ('finished', 'cancelled') and old.status not in ('finished', 'cancelled') then
    update public.lockers
    set
      status             = 'available',
      current_booking_id = null,
      updated_at         = now()
    where id = new.locker_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_booking_status_change on public.bookings;
create trigger on_booking_status_change
  after update of status on public.bookings
  for each row execute function public.release_locker_on_booking_end();


-- ─────────────────────────────────────────
--  TABLE: transactions
--  Financial log — one row per payment event.
-- ─────────────────────────────────────────
create table if not exists public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  booking_id      uuid references public.bookings(id),
  hub_id          uuid references public.hubs(id),

  type            payment_type not null,
  method          payment_method not null default 'qris',
  amount          int not null,            -- IDR
  status          text not null default 'success',  -- 'success' | 'pending' | 'failed'
  description     text,                    -- e.g. "Extend +1 hr — M-07"

  created_at      timestamptz not null default now()
);


-- ─────────────────────────────────────────
--  TABLE: notifications
--  Push-style in-app notifications per user.
-- ─────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        notif_type not null default 'info',
  title       text not null,
  message     text not null,
  action_url  text,          -- deep-link, e.g. "/my-locker"
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);


-- ─────────────────────────────────────────
--  ROW-LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.hubs          enable row level security;
alter table public.lockers       enable row level security;
alter table public.bookings      enable row level security;
alter table public.transactions  enable row level security;
alter table public.notifications enable row level security;

-- profiles: users can only see/edit their own row
create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id);

-- hubs: public read
create policy "hubs: public read" on public.hubs
  for select using (true);

-- lockers: public read (availability visible to all), write restricted
create policy "lockers: public read" on public.lockers
  for select using (true);

-- lockers: only service role (Edge Functions / ESP32 webhook) can update status
-- (anon users cannot directly flip locker status)
create policy "lockers: service write" on public.lockers
  for update using (auth.role() = 'service_role');

-- bookings: users see only their own
create policy "bookings: own rows" on public.bookings
  for all using (auth.uid() = user_id);

-- transactions: users see only their own
create policy "transactions: own rows" on public.transactions
  for all using (auth.uid() = user_id);

-- notifications: users see only their own
create policy "notifications: own rows" on public.notifications
  for all using (auth.uid() = user_id);


-- ─────────────────────────────────────────
--  HELPER VIEWS
-- ─────────────────────────────────────────

-- Slot availability per hub (used by 02 Nearby Lockers screen)
create or replace view public.hub_availability as
select
  h.id          as hub_id,
  h.name,
  h.sub_location,
  h.category,
  h.distance_km,
  h.walk_minutes,
  h.is_active,
  count(*) filter (where l.status = 'available')             as total_available,
  count(*) filter (where l.size = 'S' and l.status = 'available') as s_available,
  count(*) filter (where l.size = 'M' and l.status = 'available') as m_available,
  count(*) filter (where l.size = 'L' and l.status = 'available') as l_available
from public.hubs h
left join public.lockers l on l.hub_id = h.id
where h.is_active = true
group by h.id, h.name, h.sub_location, h.category, h.distance_km, h.walk_minutes, h.is_active;


-- ─────────────────────────────────────────
--  REALTIME — enable for lockers table
--  ESP32-S3 listens to changes on its own locker row
--  via Supabase Realtime WebSocket.
-- ─────────────────────────────────────────
-- Run these in Supabase Dashboard → Database → Replication
-- if the SQL Editor variant is not available:
--
--   supabase realtime enable public.lockers
--
-- Or via SQL (Supabase internal):
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table
    public.lockers,
    public.bookings,
    public.notifications;
commit;


-- ─────────────────────────────────────────
--  SEED DATA
-- ─────────────────────────────────────────

-- 1. HUBS
insert into public.hubs (id, name, sub_location, category, address, lat, lng, distance_km, walk_minutes) values
(
  'a1000000-0000-0000-0000-000000000001',
  'Petra Christian University',
  'Gedung P lobby',
  'campus',
  'Jl. Siwalankerto No.121-131, Surabaya',
  -7.3131, 112.7193,
  0.10, 2
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Petra Library Hub',
  'UPT Perpustakaan, Lt. 1',
  'campus',
  'Jl. Siwalankerto No.121-131, Surabaya',
  -7.3135, 112.7190,
  0.30, 5
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Gubeng Station',
  'Hall timur, dekat pintu masuk',
  'station',
  'Jl. Gubeng Masjid No.1, Surabaya',
  -7.2652, 112.7508,
  2.40, 12
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Tunjungan Plaza',
  'Basement B2, Area Parkir Motor',
  'mall',
  'Jl. Basuki Rahmat No.8-12, Surabaya',
  -7.2626, 112.7378,
  3.10, 18
)
on conflict (id) do nothing;


-- 2. LOCKERS — Petra Christian University (Hub 1)
--    Blueprint: ESP32-S3 unit, QR on TFT LCD, RFID fallback
--    Demo unit: Locker M-07  →  qr_payload = 'TITIPIN:UK_PETRA:M-07'
insert into public.lockers (id, hub_id, locker_number, size, status, qr_payload, rfid_uid) values
-- S lockers
('b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','S-01','S','available','TITIPIN:UK_PETRA:S-01','A1:B2:C3:01'),
('b1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','S-02','S','available','TITIPIN:UK_PETRA:S-02','A1:B2:C3:02'),
('b1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','S-03','S','available','TITIPIN:UK_PETRA:S-03','A1:B2:C3:03'),
('b1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','S-04','S','available','TITIPIN:UK_PETRA:S-04','A1:B2:C3:04'),
-- M lockers
('b1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','M-05','M','available','TITIPIN:UK_PETRA:M-05','A1:B2:C3:05'),
('b1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000001','M-06','M','available','TITIPIN:UK_PETRA:M-06','A1:B2:C3:06'),
-- ★ DEMO UNIT — M-07: status = 'occupied' (simulates active booking in the demo)
('b1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000001','M-07','M','occupied', 'TITIPIN:UK_PETRA:M-07','A1:B2:C3:07'),
('b1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000001','M-08','M','available','TITIPIN:UK_PETRA:M-08','A1:B2:C3:08'),
-- L lockers
('b1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000001','L-01','L','available','TITIPIN:UK_PETRA:L-01','A1:B2:C3:09')
on conflict (id) do nothing;

-- 3. LOCKERS — Petra Library Hub (Hub 2)
insert into public.lockers (id, hub_id, locker_number, size, status, qr_payload, rfid_uid) values
('b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','S-01','S','available','TITIPIN:PETRA_LIB:S-01','B2:C3:D4:01'),
('b2000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002','S-02','S','available','TITIPIN:PETRA_LIB:S-02','B2:C3:D4:02'),
('b2000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000002','M-01','M','available','TITIPIN:PETRA_LIB:M-01','B2:C3:D4:03'),
('b2000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002','M-02','M','available','TITIPIN:PETRA_LIB:M-02','B2:C3:D4:04')
on conflict (id) do nothing;

-- 4. LOCKERS — Gubeng Station (Hub 3)
insert into public.lockers (id, hub_id, locker_number, size, status, qr_payload, rfid_uid) values
('b3000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','S-01','S','available','TITIPIN:GUBENG:S-01','C3:D4:E5:01'),
('b3000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','S-02','S','available','TITIPIN:GUBENG:S-02','C3:D4:E5:02'),
('b3000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003','S-03','S','available','TITIPIN:GUBENG:S-03','C3:D4:E5:03'),
('b3000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000003','S-04','S','available','TITIPIN:GUBENG:S-04','C3:D4:E5:04'),
('b3000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000003','S-05','S','available','TITIPIN:GUBENG:S-05','C3:D4:E5:05'),
('b3000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000003','S-06','S','available','TITIPIN:GUBENG:S-06','C3:D4:E5:06'),
('b3000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000003','M-01','M','available','TITIPIN:GUBENG:M-01','C3:D4:E5:07'),
('b3000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000003','M-02','M','available','TITIPIN:GUBENG:M-02','C3:D4:E5:08'),
('b3000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000003','M-03','M','available','TITIPIN:GUBENG:M-03','C3:D4:E5:09'),
('b3000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000003','M-04','M','available','TITIPIN:GUBENG:M-04','C3:D4:E5:10'),
('b3000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000003','L-01','L','available','TITIPIN:GUBENG:L-01','C3:D4:E5:11'),
('b3000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000003','L-02','L','available','TITIPIN:GUBENG:L-02','C3:D4:E5:12')
on conflict (id) do nothing;

-- 5. LOCKERS — Tunjungan Plaza (Hub 4)
insert into public.lockers (id, hub_id, locker_number, size, status, qr_payload, rfid_uid) values
('b4000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','S-01','S','available','TITIPIN:TP:S-01','D4:E5:F6:01'),
('b4000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','S-02','S','available','TITIPIN:TP:S-02','D4:E5:F6:02'),
('b4000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','S-03','S','available','TITIPIN:TP:S-03','D4:E5:F6:03'),
('b4000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004','L-01','L','available','TITIPIN:TP:L-01','D4:E5:F6:04')
on conflict (id) do nothing;


-- ─────────────────────────────────────────
--  VERIFY (optional — run after seed)
-- ─────────────────────────────────────────
-- select * from public.hub_availability order by distance_km;
-- select locker_number, size, status, qr_payload, rfid_uid
--   from public.lockers where hub_id = 'a1000000-0000-0000-0000-000000000001'
--   order by locker_number;

-- ============================================================
--  END OF SCHEMA
-- ============================================================
