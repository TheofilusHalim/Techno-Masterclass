-- ============================================================
--  TITIPIN — Supabase Patch v2.0 (Hardware Alignment & Audit Logs)
--  Sesuai Dokumen Spesifikasi Teknis & ERD v2.0
-- ============================================================

-- 1. Tambahkan kolom IoT pada tabel lockers jika belum ada
alter table public.lockers 
  add column if not exists door_command varchar(20) not null default 'LOCKED';

alter table public.lockers 
  add column if not exists is_occupied boolean not null default false;

-- Sinkronisasi awal status occupied jika sudah ada booking aktif
update public.lockers 
set is_occupied = true 
where status = 'occupied';

-- 2. Buat tabel locker_logs untuk audit trail pembukaan kunci
create table if not exists public.locker_logs (
  id uuid primary key default gen_random_uuid(),
  locker_id uuid references public.lockers(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  access_method varchar(30) not null default 'QR_SCAN', -- 'QR_SCAN', 'REMOTE_APP', 'RFID_TAP', 'CS_OVERRIDE'
  action varchar(50) not null default 'DOOR_UNLOCKED',   -- 'DOOR_UNLOCKED', 'EXTENDED_1HR'
  created_at timestamptz not null default now()
);

-- 3. RLS untuk locker_logs agar publik/demo app bisa baca & tulis log
alter table public.locker_logs enable row level security;

drop policy if exists "locker_logs: public read" on public.locker_logs;
drop policy if exists "locker_logs: public insert" on public.locker_logs;

create policy "locker_logs: public read" on public.locker_logs for select using (true);
create policy "locker_logs: public insert" on public.locker_logs for insert with check (true);

-- 4. Pastikan replication identity full untuk Realtime Supabase
alter table public.lockers replica identity full;
alter table public.locker_logs replica identity full;

-- 5. Trigger otomatis untuk sinkronisasi is_occupied saat status berubah
create or replace function public.sync_locker_occupied_status()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'occupied' or new.current_booking_id is not null then
    new.is_occupied := true;
  elsif new.status = 'available' then
    new.is_occupied := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_locker_occupied on public.lockers;
create trigger trg_sync_locker_occupied
  before insert or update on public.lockers
  for each row execute function public.sync_locker_occupied_status();

-- 6. Notifikasi reload schema ke PostgREST
notify pgrst, 'reload schema';
