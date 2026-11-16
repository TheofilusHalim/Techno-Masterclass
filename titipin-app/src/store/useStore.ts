import { create } from 'zustand'

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

interface AppState {
  // Active locker session
  hasActiveLocker: boolean
  lockerNumber: string
  lockerSize: string
  lockerLocation: string
  remainingSeconds: number
  qrRefreshSeconds: number
  lockerStatus: LockerStatus
  lockerStatusLog: string[]

  // User & plan
  userName: string
  hasMonthlyPlan: boolean

  // Booking flow state
  selectedHub: string
  selectedSize: 'S' | 'M' | 'L'
  selectedMode: 'per-hour' | 'subscription'
  selectedDuration: number

  // Transactions
  transactions: Transaction[]

  // Notifications badge
  unreadNotifications: number

  // Actions
  setActiveLocker: (data: { lockerNumber: string; lockerSize: string; lockerLocation: string; duration: number }) => void
  tickLockerTimer: () => void
  tickQRTimer: () => void
  extendLocker: () => void
  triggerUnlock: (source: string) => void
  setSelectedHub: (hub: string) => void
  setSelectedSize: (size: 'S' | 'M' | 'L') => void
  setSelectedMode: (mode: 'per-hour' | 'subscription') => void
  setSelectedDuration: (dur: number) => void
  addTransaction: (tx: Transaction) => void
  subscribeMonthly: () => void
  markNotificationsRead: () => void
}

export const useStore = create<AppState>((set, get) => ({
  hasActiveLocker: true,
  lockerNumber: 'M-07',
  lockerSize: 'M',
  lockerLocation: 'Petra Christian University',
  remainingSeconds: 6712, // ~01:51:52
  qrRefreshSeconds: 60,
  lockerStatus: 'idle',
  lockerStatusLog: ['System initialized'],

  userName: 'Kevin',
  hasMonthlyPlan: false,

  selectedHub: 'Petra Christian University',
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

  setActiveLocker: ({ lockerNumber, lockerSize, lockerLocation, duration }) =>
    set({
      hasActiveLocker: true,
      lockerNumber,
      lockerSize,
      lockerLocation,
      remainingSeconds: duration * 3600,
      qrRefreshSeconds: 60,
    }),

  tickLockerTimer: () =>
    set((s) => ({
      remainingSeconds: Math.max(0, s.remainingSeconds - 1),
    })),

  tickQRTimer: () =>
    set((s) => ({
      qrRefreshSeconds: s.qrRefreshSeconds <= 1 ? 60 : s.qrRefreshSeconds - 1,
    })),

  extendLocker: () => {
    const { addTransaction, lockerNumber, lockerSize, lockerLocation } = get()
    set((s) => ({ remainingSeconds: s.remainingSeconds + 3600 }))
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
  },

  triggerUnlock: (source: string) => {
    const log = [`[${new Date().toLocaleTimeString()}] Unlock triggered by ${source}`, ...get().lockerStatusLog].slice(0, 10)
    set({ lockerStatus: 'unlocked', lockerStatusLog: log })
    setTimeout(() => {
      const log2 = [`[${new Date().toLocaleTimeString()}] Door re-locked automatically`, ...get().lockerStatusLog].slice(0, 10)
      set({ lockerStatus: 'locked', lockerStatusLog: log2 })
      setTimeout(() => set({ lockerStatus: 'idle' }), 2000)
    }, 5000)
  },

  setSelectedHub: (hub) => set({ selectedHub: hub }),
  setSelectedSize: (size) => set({ selectedSize: size }),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setSelectedDuration: (dur) => set({ selectedDuration: dur }),

  addTransaction: (tx) =>
    set((s) => ({ transactions: [tx, ...s.transactions] })),

  subscribeMonthly: () => {
    const { addTransaction } = get()
    set({ hasMonthlyPlan: true })
    addTransaction({
      id: `tx-sub-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      location: 'All Hubs',
      lockerSize: 'S/M',
      lockerNumber: 'Monthly',
      amount: 125000,
      type: 'subscription',
      status: 'plan',
    })
  },

  markNotificationsRead: () => set({ unreadNotifications: 0 }),
}))
