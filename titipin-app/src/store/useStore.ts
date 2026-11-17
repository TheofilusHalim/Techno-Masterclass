import { create } from 'zustand'
import {
  triggerDoorUnlockRemote,
  extendBooking,
  fetchActiveBooking,
  subscribeMonthlyPlan,
} from '../lib/lockerService'
import type { Booking, AccessMethod } from '../lib/database.types'
import { supabase } from '../lib/supabase'

export interface Transaction {
  id: string
  date: string
  location: string
  lockerSize: string
  lockerNumber: string
  duration?: number
  amount: number
  type: 'per-hour' | 'subscription'
  status: 'success' | 'plan'
}

export type LockerStatus = 'locked' | 'unlocked' | 'idle'
export type ConnectionStatus = 'connected' | 'connecting' | 'error'

interface AppState {
  // Active locker session & Supabase booking link
  hasActiveLocker: boolean
  activeBookingId: string | null
  activeBooking: Booking | null
  lockerNumber: string
  lockerSize: string
  lockerLocation: string
  remainingSeconds: number
  qrRefreshSeconds: number
  lockerStatus: LockerStatus
  isDoorOpen: boolean
  lockerStatusLog: string[]

  // Supabase connection state
  connectionStatus: ConnectionStatus
  connectionError: string | null

  // User & authentication
  userName: string
  userEmail: string
  userId: string | null
  isAuthenticated: boolean
  hasMonthlyPlan: boolean
  planExpiresAt: string | null

  // Booking flow state
  selectedHub: string
  selectedHubId: string
  selectedSize: 'S' | 'M' | 'L'
  selectedMode: 'per-hour' | 'subscription'
  selectedDuration: number

  // Transactions
  transactions: Transaction[]

  // Notifications badge
  unreadNotifications: number

  // Actions
  setActiveLocker: (data: {
    lockerNumber: string
    lockerSize: string
    lockerLocation: string
    duration: number
    bookingId?: string
  }) => void
  setActiveBooking: (booking: Booking | null) => void
  loadActiveBooking: (userId?: string) => Promise<void>
  tickLockerTimer: () => void
  tickQRTimer: () => void
  extendLocker: () => Promise<void>
  triggerUnlock: (source: string, accessMethod?: AccessMethod) => Promise<void>
  setDoorOpenFromRealtime: (isOpen: boolean, source?: string) => void
  setSelectedHub: (hub: string, hubId?: string) => void
  setSelectedSize: (size: 'S' | 'M' | 'L') => void
  setSelectedMode: (mode: 'per-hour' | 'subscription') => void
  setSelectedDuration: (dur: number) => void
  addTransaction: (tx: Transaction) => void
  subscribeMonthly: () => Promise<{ success: boolean; message: string; error?: string }>
  refreshUserProfile: (userId?: string) => Promise<void>
  markNotificationsRead: () => void
  setConnectionStatus: (status: ConnectionStatus, error?: string | null) => void
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  registerUser: (fullName: string, email: string, password: string) => Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: string }>
  logoutUser: () => Promise<void>
  loginDemo: (name?: string, email?: string) => void
}

let unlockTimer: ReturnType<typeof setTimeout> | null = null

export const useStore = create<AppState>((set, get) => ({
  hasActiveLocker: true,
  activeBookingId: 'b1000000-0000-0000-0000-000000000007',
  activeBooking: null,
  lockerNumber: 'M-07',
  lockerSize: 'M',
  lockerLocation: 'Petra Christian University',
  remainingSeconds: 6712, // ~01:51:52
  qrRefreshSeconds: 60,
  lockerStatus: 'idle',
  isDoorOpen: false,
  lockerStatusLog: [
    `[${new Date().toLocaleTimeString()}] Supabase client initialized`,
  ],

  connectionStatus: 'connected',
  connectionError: null,

  userName: 'Kevin',
  userEmail: 'kevin@example.com',
  userId: 'u1000000-0000-0000-0000-000000000001',
  isAuthenticated: true,
  hasMonthlyPlan: false,
  planExpiresAt: null,

  selectedHub: 'Petra Christian University',
  selectedHubId: '11111111-1111-1111-1111-111111111111',
  selectedSize: 'M',
  selectedMode: 'per-hour',
  selectedDuration: 2,

  transactions: [
    {
      id: 'tx-001',
      date: '2026-11-15',
      location: 'Petra Christian University',
      lockerSize: 'M',
      lockerNumber: 'M-07',
      duration: 2,
      amount: 6000,
      type: 'per-hour',
      status: 'success',
    },
    {
      id: 'tx-002',
      date: '2026-11-14',
      location: 'Gubeng Station',
      lockerSize: 'S',
      lockerNumber: 'S-03',
      duration: 1,
      amount: 3000,
      type: 'per-hour',
      status: 'success',
    },
    {
      id: 'tx-003',
      date: '2026-11-01',
      location: 'All Hubs',
      lockerSize: 'S/M',
      lockerNumber: 'Monthly',
      amount: 125000,
      type: 'subscription',
      status: 'plan',
    },
  ],

  unreadNotifications: 2,

  setActiveLocker: ({ lockerNumber, lockerSize, lockerLocation, duration, bookingId }) =>
    set({
      hasActiveLocker: true,
      activeBookingId: bookingId || get().activeBookingId,
      lockerNumber,
      lockerSize,
      lockerLocation,
      remainingSeconds: duration * 3600,
      qrRefreshSeconds: 60,
    }),

  setActiveBooking: (booking) => {
    if (!booking) {
      set({ activeBooking: null, activeBookingId: null, hasActiveLocker: false })
      return
    }
    const expiresAt = new Date(booking.expires_at).getTime()
    const now = Date.now()
    const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000))
    set({
      hasActiveLocker: true,
      activeBooking: booking,
      activeBookingId: booking.id,
      lockerNumber: booking.locker?.locker_number || get().lockerNumber,
      lockerSize: (booking.locker?.size as any) || get().lockerSize,
      lockerLocation: booking.hub?.name || get().lockerLocation,
      remainingSeconds: remainingSeconds > 0 ? remainingSeconds : get().remainingSeconds,
    })
  },

  loadActiveBooking: async (userId?: string) => {
    try {
      const uid = userId || get().userId
      const { data: booking } = await fetchActiveBooking(uid || undefined)
      if (booking) {
        get().setActiveBooking(booking)
      }
    } catch (err) {
      console.warn('loadActiveBooking error:', err)
    }
  },

  tickLockerTimer: () =>
    set((s) => ({
      remainingSeconds: Math.max(0, s.remainingSeconds - 1),
    })),

  tickQRTimer: () =>
    set((s) => ({
      qrRefreshSeconds: s.qrRefreshSeconds <= 1 ? 60 : s.qrRefreshSeconds - 1,
    })),

  extendLocker: async () => {
    const { addTransaction, lockerNumber, lockerSize, lockerLocation, activeBookingId } = get()

    // 1. Optimistically update local timer and transaction for instant UX feedback
    set((s) => ({
      remainingSeconds: s.remainingSeconds + 3600,
      lockerStatusLog: [
        `[${new Date().toLocaleTimeString()}] Extend +1 hr requested (Supabase: extendBooking)`,
        ...s.lockerStatusLog,
      ].slice(0, 15),
    }))

    addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      location: lockerLocation,
      lockerSize,
      lockerNumber,
      duration: 1,
      amount: 3000,
      type: 'per-hour',
      status: 'success',
    })

    // 2. Call Supabase extendBooking API
    try {
      const res = await extendBooking(activeBookingId || lockerNumber, 1)
      if (res.success && res.newExpiresAt) {
        const remaining = Math.max(0, Math.floor((new Date(res.newExpiresAt).getTime() - Date.now()) / 1000))
        if (remaining > 0) {
          set({ remainingSeconds: remaining })
        }
      }
    } catch (err) {
      console.warn('extendBooking API error:', err)
    }
  },

  triggerUnlock: async (source: string, accessMethod: AccessMethod = 'REMOTE_APP') => {
    const { lockerNumber, activeBookingId } = get()
    const timeStr = new Date().toLocaleTimeString()
    const log = [
      `[${timeStr}] Unlock triggered by ${source} (${accessMethod}) -> Supabase: door_command = UNLOCK (5s)`,
      ...get().lockerStatusLog,
    ].slice(0, 15)

    // Clear any pending timer
    if (unlockTimer) clearTimeout(unlockTimer)

    // Update local store state immediately
    set({ lockerStatus: 'unlocked', isDoorOpen: true, lockerStatusLog: log })

    // Call Supabase API to update door_command = 'UNLOCK' & record access_method in locker_logs
    triggerDoorUnlockRemote(lockerNumber, accessMethod, activeBookingId).catch((e) => {
      console.warn('triggerDoorUnlockRemote catch:', e)
    })

    // Set 5-second auto-relock in local state
    unlockTimer = setTimeout(() => {
      const relockTime = new Date().toLocaleTimeString()
      const log2 = [
        `[${relockTime}] Auto-relocked (Supabase: door_command = LOCKED, is_door_open = false)`,
        ...get().lockerStatusLog,
      ].slice(0, 15)
      set({ lockerStatus: 'locked', isDoorOpen: false, lockerStatusLog: log2 })

      setTimeout(() => {
        set({ lockerStatus: 'idle' })
      }, 2000)
    }, 5000)
  },

  setDoorOpenFromRealtime: (isOpen: boolean, source?: string) => {
    const currentOpen = get().isDoorOpen
    if (currentOpen === isOpen) return

    const timeStr = new Date().toLocaleTimeString()
    const label = source || 'Supabase Realtime'
    const newStatus: LockerStatus = isOpen ? 'unlocked' : 'locked'

    const log = [
      `[${timeStr}] ${label} -> Door ${isOpen ? 'OPEN' : 'CLOSED'}`,
      ...get().lockerStatusLog,
    ].slice(0, 15)

    set({
      isDoorOpen: isOpen,
      lockerStatus: newStatus,
      lockerStatusLog: log,
    })

    if (!isOpen) {
      setTimeout(() => set({ lockerStatus: 'idle' }), 2000)
    }
  },

  setSelectedHub: (hub, hubId) =>
    set({
      selectedHub: hub,
      selectedHubId: hubId || get().selectedHubId,
    }),

  setSelectedSize: (size) => set({ selectedSize: size }),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setSelectedDuration: (dur) => set({ selectedDuration: dur }),

  addTransaction: (tx) =>
    set((s) => ({ transactions: [tx, ...s.transactions] })),

  subscribeMonthly: async () => {
    const { hasMonthlyPlan, userId, addTransaction } = get()
    if (hasMonthlyPlan) {
      return {
        success: false,
        message: 'Akun Anda sudah memiliki langganan aktif.',
        error: 'ALREADY_ACTIVE',
      }
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
    set({
      hasMonthlyPlan: true,
      planExpiresAt: expiresAt,
    })

    addTransaction({
      id: `tx-sub-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      location: 'All Hubs (Member VIP)',
      lockerSize: 'S/M',
      lockerNumber: 'Member Pass',
      amount: 125000,
      type: 'subscription',
      status: 'plan',
    })

    try {
      const res = await subscribeMonthlyPlan(userId || undefined)
      if (res.planExpiresAt) {
        set({ planExpiresAt: res.planExpiresAt, hasMonthlyPlan: res.success })
      }
      return res
    } catch {
      return { success: true, message: 'Langganan berhasil diaktifkan (Demo mode)' }
    }
  },

  refreshUserProfile: async (userId?: string) => {
    try {
      const uid = userId || get().userId
      if (!uid || uid.startsWith('u1000')) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_monthly_plan, plan_expires_at')
        .eq('id', uid)
        .maybeSingle()
      if (profile) {
        const isExpired = profile.plan_expires_at && new Date(profile.plan_expires_at).getTime() < Date.now()
        set({
          hasMonthlyPlan: Boolean(profile.has_monthly_plan) && !isExpired,
          planExpiresAt: profile.plan_expires_at,
        })
      }
    } catch (err) {
      console.warn('refreshUserProfile error:', err)
    }
  },

  markNotificationsRead: () => {
    if (get().unreadNotifications !== 0) {
      set({ unreadNotifications: 0 })
    }
  },

  setConnectionStatus: (status, error = null) =>
    set({ connectionStatus: status, connectionError: error }),

  loginUser: async (email, password) => {
    try {
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'Connection timed out. Please check your network.' } }), 8000)
      )

      const authPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      const res = await Promise.race([authPromise, timeoutPromise])
      const { data, error } = res as any

      if (error) {
        return { success: false, error: error.message }
      }

      if (data?.user) {
        const displayName = data.user.user_metadata?.full_name || email.split('@')[0]
        set({
          userName: displayName,
          userEmail: data.user.email || email,
          userId: data.user.id,
          isAuthenticated: true,
        })
        get().loadActiveBooking(data.user.id)
        get().refreshUserProfile(data.user.id)
        return { success: true }
      }

      return { success: false, error: 'Login failed: no user returned.' }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  },

  registerUser: async (fullName, email, password) => {
    try {
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'Connection timed out. Please check your network.' } }), 8000)
      )

      const authPromise = supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      const res = await Promise.race([authPromise, timeoutPromise])
      const { data, error } = res as any

      if (error) {
        return { success: false, error: error.message }
      }

      if (data?.user) {
        if (data.session) {
          set({
            userName: fullName.trim(),
            userEmail: data.user.email || email,
            userId: data.user.id,
            isAuthenticated: true,
          })
          return { success: true, needsEmailConfirmation: false }
        }

        return {
          success: true,
          needsEmailConfirmation: true,
        }
      }

      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  },

  logoutUser: async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Signout warning:', err)
    }
    set({
      userName: 'Guest',
      userEmail: '',
      userId: null,
      isAuthenticated: false,
      hasActiveLocker: false,
      activeBookingId: null,
      activeBooking: null,
    })
  },

  loginDemo: (name = 'Kevin', email = 'kevin@example.com') => {
    set({
      userName: name,
      userEmail: email,
      userId: 'u1000000-0000-0000-0000-000000000001',
      isAuthenticated: true,
    })
    get().loadActiveBooking('u1000000-0000-0000-0000-000000000001')
  },
}))
