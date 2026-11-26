import { create } from 'zustand'
import {
  triggerDoorUnlockRemote,
  extendBooking,
  fetchActiveBookings,
  subscribeMonthlyPlan,
  markBookingOverdue,
  confirmItemsRetrieved,
  fetchUserTransactions,
} from '../lib/lockerService'
import type { Booking, AccessMethod } from '../lib/database.types'
import { supabase } from '../lib/supabase'
import { sendSystemNotification } from '../lib/notificationService'

export interface Transaction {
  id: string
  date: string
  location: string
  lockerSize: string
  lockerNumber: string
  duration?: number
  amount: number
  type: 'per-hour' | 'subscription'
  method?: string
  status: 'success' | 'plan'
}

export interface AppNotification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  timeAgo: string
  timestamp: number
  action?: string
  actionLabel?: string
}

export type LockerStatus = 'locked' | 'unlocked' | 'idle'
export type ConnectionStatus = 'connected' | 'connecting' | 'error'

interface AppState {
  // Active locker session & Supabase booking link
  hasActiveLocker: boolean
  activeBookingId: string | null
  activeBooking: Booking | null
  activeBookings: Booking[]
  selectedActiveBookingIndex: number
  lockerNumber: string
  lockerSize: string
  lockerLocation: string
  remainingSeconds: number
  qrRefreshSeconds: number
  lockerStatus: LockerStatus
  isDoorOpen: boolean
  lockerStatusLog: string[]

  // Overdue state
  isOverdue: boolean
  lateFee: number

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

  // Notifications
  notifications: AppNotification[]
  unreadNotifications: number

  // Language preferences
  language: 'id' | 'en'
  setLanguage: (lang: 'id' | 'en') => void

  // Actions
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void
  clearNotifications: () => void
  setActiveLocker: (data: {
    lockerNumber: string
    lockerSize: string
    lockerLocation: string
    duration: number
    bookingId?: string
  }) => void
  setActiveBooking: (booking: Booking | null) => void
  selectActiveBooking: (index: number) => void
  loadActiveBooking: (userId?: string) => Promise<void>
  tickLockerTimer: () => void
  tickQRTimer: () => void
  extendLocker: () => Promise<void>
  retrieveItems: (paymentMethod?: string) => Promise<{ success: boolean; lateFee: number; message: string; error: string | null }>
  triggerUnlock: (source: string, accessMethod?: AccessMethod) => Promise<void>
  setDoorOpenFromRealtime: (isOpen: boolean, source?: string) => void
  setSelectedHub: (hub: string, hubId?: string) => void
  setSelectedSize: (size: 'S' | 'M' | 'L') => void
  setSelectedMode: (mode: 'per-hour' | 'subscription') => void
  setSelectedDuration: (dur: number) => void
  addTransaction: (tx: Transaction) => void
  loadTransactions: (userId?: string) => Promise<void>
  subscribeMonthly: () => Promise<{ success: boolean; message: string; error?: string }>
  refreshUserProfile: (userId?: string) => Promise<void>
  markNotificationsRead: () => void
  setConnectionStatus: (status: ConnectionStatus, error?: string | null) => void
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  registerUser: (fullName: string, email: string, password: string) => Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: string }>
  logoutUser: () => Promise<void>
}

let unlockTimer: ReturnType<typeof setTimeout> | null = null

const TX_STORAGE_KEY = 'titipin_transactions_v1'
const NOTIF_STORAGE_KEY = 'titipin_notifications_v1'
const UNREAD_STORAGE_KEY = 'titipin_unread_v1'

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome',
    type: 'info',
    title: 'Selamat Datang di Titipin!',
    message: 'Loker pintar digital berbasis IoT pertama di Surabaya. Nikmati kemudahan sewa & buka loker via aplikasi.',
    timeAgo: 'Baru saja',
    timestamp: Date.now(),
    action: '/nearby-lockers',
    actionLabel: 'Cari Loker',
  },
]

function loadSavedJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage quota errors
  }
}

export const useStore = create<AppState>((set, get) => ({
  hasActiveLocker: false,
  activeBookingId: null,
  activeBooking: null,
  activeBookings: [],
  selectedActiveBookingIndex: 0,
  lockerNumber: '',
  lockerSize: 'M',
  lockerLocation: 'Petra Christian University',
  remainingSeconds: 0,
  qrRefreshSeconds: 60,
  lockerStatus: 'idle',
  isDoorOpen: false,
  lockerStatusLog: [
    `[${new Date().toLocaleTimeString()}] Supabase client initialized`,
  ],

  isOverdue: false,
  lateFee: 0,

  connectionStatus: 'connected',
  connectionError: null,

  userName: '',
  userEmail: '',
  userId: null,
  isAuthenticated: false,
  hasMonthlyPlan: false,
  planExpiresAt: null,

  selectedHub: 'Petra Christian University',
  selectedHubId: '11111111-1111-1111-1111-111111111111',
  selectedSize: 'M',
  selectedMode: 'per-hour',
  selectedDuration: 2,

  transactions: loadSavedJSON<Transaction[]>(TX_STORAGE_KEY, []),

  notifications: loadSavedJSON<AppNotification[]>(NOTIF_STORAGE_KEY, DEFAULT_NOTIFICATIONS),
  unreadNotifications: loadSavedJSON<number>(UNREAD_STORAGE_KEY, 1),

  language: loadSavedJSON<'id' | 'en'>('titipin_language_v1', 'id'),
  setLanguage: (lang) => {
    saveJSON('titipin_language_v1', lang)
    set({ language: lang })
  },

  addNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    }
    set((s) => {
      const nextNotifs = [newNotif, ...s.notifications].slice(0, 50)
      const nextUnread = s.unreadNotifications + 1
      saveJSON(NOTIF_STORAGE_KEY, nextNotifs)
      saveJSON(UNREAD_STORAGE_KEY, nextUnread)
      return {
        notifications: nextNotifs,
        unreadNotifications: nextUnread,
      }
    })
    // Trigger native Android system notification banner + sound
    sendSystemNotification({
      title: notif.title,
      body: notif.message,
    }).catch((err) => console.warn('System notification error:', err))
  },

  clearNotifications: () => {
    saveJSON(NOTIF_STORAGE_KEY, [])
    saveJSON(UNREAD_STORAGE_KEY, 0)
    set({ notifications: [], unreadNotifications: 0 })
  },

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

  selectActiveBooking: (index: number) => {
    const bookings = get().activeBookings
    if (bookings && bookings[index]) {
      const cur = bookings[index]
      const expiresAt = new Date(cur.expires_at).getTime()
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      const isOverdue = cur.status === 'overdue' || (remaining === 0 && cur.status !== 'finished')
      set({
        selectedActiveBookingIndex: index,
        activeBooking: cur,
        activeBookingId: cur.id,
        lockerNumber: cur.locker?.locker_number || '',
        lockerSize: (cur.locker?.size as any) || 'M',
        lockerLocation: cur.hub?.name || 'Petra Christian University',
        remainingSeconds: remaining,
        isOverdue,
      })
    }
  },

  loadActiveBooking: async (userId?: string) => {
    try {
      const uid = userId || get().userId
      if (!uid) {
        set({
          activeBookings: [],
          hasActiveLocker: false,
          activeBooking: null,
          activeBookingId: null,
          lockerNumber: '',
          remainingSeconds: 0,
          isOverdue: false,
        })
        return
      }

      const { data: bookings } = await fetchActiveBookings(uid)
      if (bookings && bookings.length > 0) {
        const selectedIdx = Math.min(get().selectedActiveBookingIndex || 0, bookings.length - 1)
        const cur = bookings[selectedIdx]
        const expiresAt = new Date(cur.expires_at).getTime()
        const now = Date.now()
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
        const isOverdue = cur.status === 'overdue' || (remaining === 0 && cur.status !== 'finished')

        if (isOverdue && cur.status !== 'overdue') {
          markBookingOverdue(cur.id, cur.locker?.locker_number || '').catch(console.warn)
        }

        set({
          activeBookings: bookings,
          hasActiveLocker: true,
          activeBooking: cur,
          activeBookingId: cur.id,
          lockerNumber: cur.locker?.locker_number || '',
          lockerSize: (cur.locker?.size as any) || 'M',
          lockerLocation: cur.hub?.name || 'Petra Christian University',
          remainingSeconds: remaining,
          selectedActiveBookingIndex: selectedIdx,
          isOverdue,
        })
      } else {
        set({
          activeBookings: [],
          hasActiveLocker: false,
          activeBooking: null,
          activeBookingId: null,
          lockerNumber: '',
          remainingSeconds: 0,
          selectedActiveBookingIndex: 0,
          isOverdue: false,
        })
      }
    } catch (err) {
      console.warn('loadActiveBooking error:', err)
    }
  },

  tickLockerTimer: () => {
    const s = get()
    if (!s.hasActiveLocker || s.remainingSeconds <= 0) return

    const nextSeconds = Math.max(0, s.remainingSeconds - 1)

    // Trigger notification when reaching exactly 10 minutes (600s)
    if (nextSeconds === 600) {
      s.addNotification({
        type: 'warning',
        title: s.language === 'en' ? 'Warning: Time is Almost Up!' : 'Peringatan: Waktu Hampir Habis!',
        message:
          s.language === 'en'
            ? `Locker ${s.lockerNumber} closes in 10 minutes. Extend now to avoid late fines.`
            : `Loker ${s.lockerNumber} akan berakhir dalam 10 menit. Perpanjang sekarang agar terhindar dari denda.`,
        timeAgo: 'Baru saja',
        action: '/my-locker',
        actionLabel: s.language === 'en' ? 'Extend now' : 'Perpanjang sekarang',
      })
    }

    // Ketika timer mencapai 0 → ubah ke status overdue (barang masih di dalam)
    if (nextSeconds === 0 && !s.isOverdue) {
      set({ remainingSeconds: 0, isOverdue: true })

      // Panggil Supabase: tandai booking dan loker sebagai overdue (bukan available!)
      markBookingOverdue(s.activeBookingId, s.lockerNumber).catch(console.warn)

      // Kirim notifikasi: segera ambil barang
      get().addNotification({
        type: 'error',
        title: s.language === 'en' ? 'Rental Time Expired!' : 'Waktu Sewa Habis!',
        message:
          s.language === 'en'
            ? `Locker ${s.lockerNumber}: Please retrieve your items immediately. Late fee is now being applied.`
            : `Loker ${s.lockerNumber}: Segera ambil barang Anda. Denda keterlambatan mulai berjalan.`,
        timeAgo: 'Baru saja',
        action: '/my-locker',
        actionLabel: s.language === 'en' ? 'Retrieve Items' : 'Ambil Barang',
      })
      return
    }

    set({ remainingSeconds: nextSeconds })
  },

  tickQRTimer: () =>
    set((s) => ({
      qrRefreshSeconds: s.qrRefreshSeconds <= 1 ? 60 : s.qrRefreshSeconds - 1,
    })),

  extendLocker: async () => {
    const { addTransaction, lockerNumber, lockerSize, lockerLocation, activeBookingId } = get()

    // 1. Optimistically update local timer and transaction for instant UX feedback
    set((s) => ({
      remainingSeconds: s.remainingSeconds + 3600,
      isOverdue: false, // Reset overdue saat perpanjang
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

    get().addNotification({
      type: 'success',
      title: get().language === 'en' ? 'Rental Extended (+1 Hr)' : 'Perpanjangan Berhasil (+1 Jam)',
      message:
        get().language === 'en'
          ? `Locker ${lockerNumber} extended by 1 hour. Time added successfully.`
          : `Loker ${lockerNumber} berhasil diperpanjang 1 jam. Waktu sewa ditambahkan.`,
      timeAgo: 'Baru saja',
      action: '/my-locker',
      actionLabel: get().language === 'en' ? 'View Locker' : 'Lihat Loker',
    })

    // 2. Call Supabase extendBooking API
    try {
      const res = await extendBooking(activeBookingId || lockerNumber, 1)
      if (res.success && res.newExpiresAt) {
        const remaining = Math.max(0, Math.floor((new Date(res.newExpiresAt).getTime() - Date.now()) / 1000))
        if (remaining > 0) {
          set((s) => ({
            remainingSeconds: remaining,
            isOverdue: false,
            activeBookings: s.activeBookings.map((b) =>
              b.id === activeBookingId ? { ...b, expires_at: res.newExpiresAt!, status: 'extended' } : b
            ),
          }))
        }
      }
    } catch (err) {
      console.warn('extendBooking API error:', err)
    }
  },

  retrieveItems: async (paymentMethod = 'QRIS') => {
    const { lockerNumber, lockerSize, lockerLocation, activeBookingId, userId, language, addTransaction } = get()
    try {
      const result = await confirmItemsRetrieved(activeBookingId, lockerNumber)
      if (result.success) {
        if (result.lateFee > 0) {
          addTransaction({
            id: `tx-fine-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            location: `${lockerLocation} (Denda Overdue)`,
            lockerSize,
            lockerNumber,
            amount: result.lateFee,
            type: 'per-hour',
            method: paymentMethod,
            status: 'success',
          })
        }

        // Reset index ke 0 dan muat ulang sisa loker aktif dari Supabase
        set({
          selectedActiveBookingIndex: 0,
          lateFee: result.lateFee,
          lockerStatus: 'idle',
        })
        await get().loadActiveBooking(userId || undefined)

        get().addNotification({
          type: 'success',
          title: language === 'en' ? 'Items Retrieved' : 'Barang Berhasil Diambil',
          message:
            result.lateFee > 0
              ? language === 'en'
                ? `Late fee Rp ${result.lateFee.toLocaleString('id-ID')} paid. Locker ${lockerNumber} unlocked & released.`
                : `Denda Rp ${result.lateFee.toLocaleString('id-ID')} lunas. Loker ${lockerNumber} terbuka & kembali tersedia.`
              : language === 'en'
              ? `Locker ${lockerNumber} unlocked & released successfully.`
              : `Loker ${lockerNumber} terbuka & kembali tersedia.`,
          timeAgo: 'Baru saja',
        })
      }
      return result
    } catch (err) {
      console.warn('retrieveItems error:', err)
      return { success: false, lateFee: 0, message: '', error: String(err) }
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

    get().addNotification({
      type: 'info',
      title: get().language === 'en' ? 'Locker Door Opened' : 'Pintu Loker Terbuka',
      message:
        get().language === 'en'
          ? `Locker ${lockerNumber} door unlocked via remote app.`
          : `Pintu Loker ${lockerNumber} berhasil dibuka melalui remote aplikasi.`,
      timeAgo: 'Baru saja',
      action: '/my-locker',
      actionLabel: get().language === 'en' ? 'Check door' : 'Cek pintu',
    })

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
    set((s) => {
      const nextTx = [tx, ...s.transactions].slice(0, 100)
      saveJSON(TX_STORAGE_KEY, nextTx)
      return { transactions: nextTx }
    }),

  loadTransactions: async (userId?: string) => {
    try {
      const uid = userId || get().userId
      if (!uid) return
      const { data } = await fetchUserTransactions(uid)
      if (data && data.length > 0) {
        saveJSON(TX_STORAGE_KEY, data)
        set({ transactions: data })
      }
    } catch (err) {
      console.warn('loadTransactions error:', err)
    }
  },

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

    get().addNotification({
      type: 'success',
      title: get().language === 'en' ? 'VIP Pass Activated!' : 'Member VIP Aktif!',
      message:
        get().language === 'en'
          ? 'Your 30-Day VIP Pass is now active. Enjoy free rentals on Size S & M lockers!'
          : 'Paket Member VIP 30 Hari Anda telah aktif. Nikmati sewa gratis loker S & M!',
      timeAgo: 'Baru saja',
      action: '/nearby-lockers',
      actionLabel: get().language === 'en' ? 'Book Locker' : 'Pesan Loker',
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
      saveJSON(UNREAD_STORAGE_KEY, 0)
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
          emailRedirectTo: 'https://theofilushalim.github.io/Techno-Masterclass/email-confirmed.html',
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
        if (data.user.email_confirmed_at) {
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
      const { error } = await supabase.auth.signOut()
      if (error) {
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch (err) {
      console.warn('Signout warning:', err)
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch {
        // ignore fallback signout error
      }
    }
    try {
      localStorage.removeItem(TX_STORAGE_KEY)
      localStorage.removeItem(NOTIF_STORAGE_KEY)
      localStorage.removeItem(UNREAD_STORAGE_KEY)
    } catch {
      // ignore
    }
    set({
      userName: '',
      userEmail: '',
      userId: null,
      isAuthenticated: false,
      hasActiveLocker: false,
      activeBookingId: null,
      activeBooking: null,
      activeBookings: [],
      selectedActiveBookingIndex: 0,
      lockerNumber: '',
      remainingSeconds: 0,
      isOverdue: false,
      lateFee: 0,
      hasMonthlyPlan: false,
      planExpiresAt: null,
      transactions: [],
      notifications: DEFAULT_NOTIFICATIONS,
      unreadNotifications: 1,
    })
  },
}))
