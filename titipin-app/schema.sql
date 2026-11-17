-- ============================================================
-- TITIPIN — Smart Digital Locker Ecosystem
-- Complete Consolidated Database Schema & Seed Script (v2.0)
-- Role: @Database_Admin (Data Architect & Supabase Specialist)
-- ============================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. ENUM TYPES
do $$ begin
  create type locker_size as enum ('S', 'M', 'L');
exception when duplicate_object then null; end $$;

do $$ begin
  create type locker_status as enum ('available', 'occupied', 'unlocked', 'maintenance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('active', 'extended', 'finished', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_type as enum ('per_hour', 'subscription');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('qris', 'ewallet', 'virtual_account');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hub_category as enum ('campus', 'station', 'mall', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notif_type as enum ('warning', 'success', 'info');
exception when duplicate_object then null; end $$;

do $$ begin
  create type access_method as enum ('QR_SCAN', 'REMOTE_APP', 'RFID_TAP', 'CS_OVERRIDE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type locker_action as enum ('DOOR_UNLOCKED', 'EXTENDED_1HR');
exception when duplicate_object then null; end $$;

-- 3. PROFILES TABLE (Supabase Auth link)
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text not null default 'User',
  email             text,
  has_monthly_plan  boolean not null default false,
  plan_expires_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        email        = excluded.email,
        updated_at   = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger to auto-confirm new users (bypasses email rate limit for seamless demo)
create or replace function public.auto_confirm_user()
returns trigger language plpgsql security definer as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

drop trigger if exists trg_auto_confirm_user on auth.users;
create trigger trg_auto_confirm_user
  before insert on auth.users
  for each row execute function public.auto_confirm_user();

-- 4. HUBS TABLE (Physical Locker Stations)
create table if not exists public.hubs (
  id            uuid primary key default uuid_generate_v4(),
  name          varchar(100) not null,
  sub_location  varchar(100),
  category      hub_category not null default 'other',
  address       text,
  lat           double precision,
  lng           double precision,
  distance_km   numeric(4, 2) default 0.1,
  walk_minutes  integer default 2,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- 5. LOCKERS TABLE (Hardware Solenoid & IoT State)
create table if not exists public.lockers (
  id                  uuid primary key default uuid_generate_v4(),
  hub_id              uuid not null references public.hubs(id) on delete cascade,
  locker_number       varchar(10) not null,
  size                locker_size not null default 'M',
  status              locker_status not null default 'available',
  hourly_rate         integer not null default 3000,
  current_pin         varchar(6) default '123456',
  is_door_open        boolean not null default false,
  door_command        varchar(20) not null default 'LOCKED',
  is_occupied         boolean not null default false,
  qr_payload          varchar(100) unique,
  rfid_uid            varchar(50) default 'A3:F2:9C:11',
  current_booking_id  uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint uq_hub_locker unique (hub_id, locker_number)
);

-- Auto-sync is_occupied trigger
create or replace function public.sync_locker_occupied()
returns trigger language plpgsql as $$
begin
  if new.status in ('occupied', 'unlocked') then
    new.is_occupied := true;
  else
    new.is_occupied := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_locker_occupied on public.lockers;
create trigger trg_sync_locker_occupied
  before insert or update on public.lockers
  for each row execute function public.sync_locker_occupied();

-- 6. BOOKINGS TABLE
create table if not exists public.bookings (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  locker_id       uuid not null references public.lockers(id) on delete cascade,
  hub_id          uuid not null references public.hubs(id) on delete cascade,
  status          booking_status not null default 'active',
  payment_type    payment_type not null default 'per_hour',
  started_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '2 hours'),
  finished_at     timestamptz,
  hours_booked    integer not null default 2,
  amount_paid     integer not null default 6000,
  payment_method  payment_method not null default 'qris',
  booking_token   varchar(64) not null default md5(random()::text),
  rfid_uid        varchar(50),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 7. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  booking_id      uuid references public.bookings(id) on delete set null,
  hub_id          uuid references public.hubs(id) on delete set null,
  type            payment_type not null default 'per_hour',
  method          payment_method not null default 'qris',
  amount          integer not null default 6000,
  status          varchar(20) not null default 'success',
  description     text,
  created_at      timestamptz not null default now()
);

-- 8. LOCKER_LOGS AUDIT TABLE
create table if not exists public.locker_logs (
  id              uuid primary key default uuid_generate_v4(),
  locker_id       uuid not null references public.lockers(id) on delete cascade,
  booking_id      uuid references public.bookings(id) on delete set null,
  access_method   access_method not null,
  action          locker_action not null,
  created_at      timestamptz not null default now()
);

-- 9. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        notif_type not null default 'info',
  title       text not null,
  message     text not null,
  action_url  text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 10. REALTIME PUBLICATION
alter publication supabase_realtime add table public.lockers;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.locker_logs;
alter publication supabase_realtime add table public.notifications;

-- 11. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.hubs enable row level security;
alter table public.lockers enable row level security;
alter table public.bookings enable row level security;
alter table public.transactions enable row level security;
alter table public.locker_logs enable row level security;
alter table public.notifications enable row level security;

-- Public read / open test policies for demo environment
create policy "Allow all read profiles" on public.profiles for select using (true);
create policy "Allow user update profile" on public.profiles for update using (true);

create policy "Allow all read hubs" on public.hubs for select using (true);
create policy "Allow all read lockers" on public.lockers for select using (true);
create policy "Allow all update lockers" on public.lockers for update using (true);

create policy "Allow read bookings" on public.bookings for select using (true);
create policy "Allow insert bookings" on public.bookings for insert with check (true);
create policy "Allow update bookings" on public.bookings for update using (true);

create policy "Allow read transactions" on public.transactions for select using (true);
create policy "Allow insert transactions" on public.transactions for insert with check (true);

create policy "Allow read locker_logs" on public.locker_logs for select using (true);
create policy "Allow insert locker_logs" on public.locker_logs for insert with check (true);

create policy "Allow read notifications" on public.notifications for select using (true);
create policy "Allow update notifications" on public.notifications for update using (true);

-- 12. SEED DATA (Surabaya Live Locations & Lockers S/M/L)
insert into public.hubs (id, name, sub_location, category, address, lat, lng, distance_km, walk_minutes)
values
  ('11111111-1111-1111-1111-111111111111', 'Petra Christian University', 'Gedung P lobby', 'campus', 'Jl. Siwalankerto No.121-131, Siwalankerto, Kec. Wonocolo, Surabaya 60236', -7.339472, 112.737528, 0.1, 2),
  ('22222222-2222-2222-2222-222222222222', 'Petra Library Hub', 'Lantai 1 Perpustakaan', 'campus', 'Perpustakaan Universitas Kristen Petra, Jl. Siwalankerto No.121, Surabaya', -7.339800, 112.736900, 0.2, 3),
  ('33333333-3333-3333-3333-333333333333', 'Gubeng Station', 'Pintu Masuk Timur', 'station', 'Stasiun Surabaya Gubeng, Jl. Gubeng Masjid No.1, Pacar Keling, Surabaya', -7.265278, 112.752222, 4.2, 15),
  ('44444444-4444-4444-4444-444444444444', 'Tunjungan Plaza', 'TP 3 UG Floor', 'mall', 'Tunjungan Plaza, Jl. Basuki Rahmat No.8-12, Genteng, Surabaya', -7.262778, 112.739167, 5.8, 20)
on conflict (id) do update set
  lat = excluded.lat,
  lng = excluded.lng,
  address = excluded.address;

-- Seed Lockers (S, M, L in each hub)
-- Demo Unit M-07 at Petra Christian University is linked to live hardware simulator
insert into public.lockers (hub_id, locker_number, size, status, hourly_rate, current_pin, is_door_open, door_command, is_occupied, qr_payload, rfid_uid)
values
  ('11111111-1111-1111-1111-111111111111', 'S-01', 'S', 'available', 2000, '111222', false, 'LOCKED', false, 'TITIPIN:UK_PETRA:S-01', 'A3:F2:9C:01'),
  ('11111111-1111-1111-1111-111111111111', 'S-02', 'S', 'available', 2000, '111223', false, 'LOCKED', false, 'TITIPIN:UK_PETRA:S-02', 'A3:F2:9C:02'),
  ('11111111-1111-1111-1111-111111111111', 'M-07', 'M', 'occupied', 3000, '948201', false, 'LOCKED', true, 'TITIPIN:UK_PETRA:M-07', 'A3:F2:9C:11'),
  ('11111111-1111-1111-1111-111111111111', 'M-08', 'M', 'available', 3000, '948202', false, 'LOCKED', false, 'TITIPIN:UK_PETRA:M-08', 'A3:F2:9C:12'),
  ('11111111-1111-1111-1111-111111111111', 'L-01', 'L', 'available', 5000, '333444', false, 'LOCKED', false, 'TITIPIN:UK_PETRA:L-01', 'A3:F2:9C:21'),
  ('22222222-2222-2222-2222-222222222222', 'S-03', 'S', 'available', 2000, '111224', false, 'LOCKED', false, 'TITIPIN:PETRA_LIB:S-03', 'A3:F2:9C:03'),
  ('22222222-2222-2222-2222-222222222222', 'M-09', 'M', 'available', 3000, '948203', false, 'LOCKED', false, 'TITIPIN:PETRA_LIB:M-09', 'A3:F2:9C:13'),
  ('22222222-2222-2222-2222-222222222222', 'L-02', 'L', 'available', 5000, '333445', false, 'LOCKED', false, 'TITIPIN:PETRA_LIB:L-02', 'A3:F2:9C:22'),
  ('33333333-3333-3333-3333-333333333333', 'L-03', 'L', 'available', 5000, '333446', false, 'LOCKED', false, 'TITIPIN:GUBENG:L-03', 'A3:F2:9C:23'),
  ('44444444-4444-4444-4444-444444444444', 'L-04', 'L', 'available', 5000, '333447', false, 'LOCKED', false, 'TITIPIN:TP:L-04', 'A3:F2:9C:24')
on conflict (hub_id, locker_number) do nothing;
