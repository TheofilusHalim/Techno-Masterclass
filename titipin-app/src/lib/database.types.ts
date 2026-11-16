// ─── Enum mirrors ────────────────────────────────────────────
export type LockerSize     = 'S' | 'M' | 'L'
export type LockerStatus   = 'available' | 'occupied' | 'unlocked' | 'maintenance'
export type BookingStatus  = 'active' | 'extended' | 'finished' | 'cancelled'
export type PaymentType    = 'per_hour' | 'subscription'
export type PaymentMethod  = 'qris' | 'ewallet' | 'virtual_account'
export type HubCategory    = 'campus' | 'station' | 'mall' | 'other'
export type NotifType      = 'warning' | 'success' | 'info'

// ─── Table row types ─────────────────────────────────────────
export interface Hub {
  id: string
  name: string
  sub_location: string | null
  category: HubCategory
  address: string | null
  lat: number | null
  lng: number | null
  distance_km: number | null
  walk_minutes: number | null
  is_active: boolean
  created_at: string
}

/** Returned by the hub_availability VIEW */
export interface HubAvailability {
  hub_id: string
  name: string
  sub_location: string | null
  category: HubCategory
  distance_km: number | null
  walk_minutes: number | null
  is_active: boolean
  total_available: number
  s_available: number
  m_available: number
  l_available: number
}

export interface Locker {
  id: string
  hub_id: string
  locker_number: string
  size: LockerSize
  status: LockerStatus
  is_door_open?: boolean
  door_command?: 'LOCKED' | 'UNLOCK'
  is_occupied?: boolean
  qr_payload: string | null   // e.g. "TITIPIN:UK_PETRA:M-07" — displayed on TFT LCD
  rfid_uid: string | null     // RFID fallback
  current_booking_id: string | null
  created_at: string
  updated_at: string
}

export type AccessMethod = 'QR_SCAN' | 'REMOTE_APP' | 'RFID_TAP' | 'CS_OVERRIDE'
export type LockerAction = 'DOOR_UNLOCKED' | 'EXTENDED_1HR'

export interface LockerLog {
  id: string
  locker_id: string
  booking_id: string | null
  access_method: AccessMethod
  action: LockerAction
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  locker_id: string
  hub_id: string
  status: BookingStatus
  payment_type: PaymentType
  started_at: string
  expires_at: string
  finished_at: string | null
  hours_booked: number
  amount_paid: number
  payment_method: PaymentMethod
  booking_token: string       // shown as QR on app screen; used for Remote Unlock API
  rfid_uid: string | null
  created_at: string
  updated_at: string
  // Joined relations
  locker?: Locker
  hub?: Hub
}

export interface DBTransaction {
  id: string
  user_id: string
  booking_id: string | null
  hub_id: string | null
  type: PaymentType
  method: PaymentMethod
  amount: number
  status: string
  description: string | null
  created_at: string
  hub?: { name: string } | null
}

export interface Profile {
  id: string
  display_name: string
  email: string | null
  has_monthly_plan: boolean
  plan_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface DBNotification {
  id: string
  user_id: string
  type: NotifType
  title: string
  message: string
  action_url: string | null
  is_read: boolean
  created_at: string
}
