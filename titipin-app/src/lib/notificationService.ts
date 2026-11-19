import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

let isChannelCreated = false

/**
 * Initializes the high-importance notification channel for Android.
 * High importance ensures notifications appear as heads-up banners with sound/vibration.
 */
export async function initNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform() || isChannelCreated) return

  try {
    await LocalNotifications.createChannel({
      id: 'titipin_alerts',
      name: 'Notifikasi Titipin',
      description: 'Pemberitahuan transaksi sewa loker, countdown waktu sewa, dan akses loker',
      importance: 5, // 5 = IMPORTANCE_HIGH (heads-up banner + sound)
      visibility: 1, // 1 = VISIBILITY_PUBLIC
      vibration: true,
      lights: true,
      lightColor: '#15803d',
    })
    isChannelCreated = true
  } catch (err) {
    console.warn('Failed to create notification channel:', err)
  }
}

/**
 * Checks and requests Android POST_NOTIFICATIONS permission.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannel()
      const status = await LocalNotifications.checkPermissions()
      if (status.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions()
        return req.display === 'granted'
      }
      return true
    } catch (err) {
      console.warn('Failed to check/request native notification permission:', err)
      return false
    }
  }

  // Web browser fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return true
    if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission()
      return res === 'granted'
    }
  }

  return false
}

/**
 * Sends a system push/heads-up notification to the Android device.
 */
export async function sendSystemNotification({
  title,
  body,
  id,
}: {
  title: string
  body: string
  id?: number
}): Promise<void> {
  const notifId = id || Math.floor(Math.random() * 2147483647)

  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannel()
      const hasPermission = await requestNotificationPermission()
      if (!hasPermission) {
        console.warn('Notification permission not granted on Android device')
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            schedule: { at: new Date(Date.now() + 200) }, // Trigger immediately (200ms)
            channelId: 'titipin_alerts',
            sound: undefined,
            smallIcon: 'ic_launcher',
            actionTypeId: '',
            extra: null,
          },
        ],
      })
    } catch (err) {
      console.warn('Error scheduling native local notification:', err)
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      })
    } catch (e) {
      console.warn('Web notification error:', e)
    }
  }
}
