import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'

export interface AppVersionInfo {
  id: string
  version_code: number
  version_name: string
  title: string
  release_notes: string
  apk_url: string
  is_critical: boolean
  released_at: string
}

// Current fallback app version (v1.0.4)
export const CURRENT_APP_VERSION = {
  versionCode: 104,
  versionName: '1.0.4',
}

/**
 * Retrieves the actual installed app version from Android native runtime if on mobile,
 * or returns CURRENT_APP_VERSION fallback when running in web browser.
 */
export async function getInstalledAppVersion(): Promise<{ versionCode: number; versionName: string }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await App.getInfo()
      const buildNum = parseInt(info.build, 10)
      return {
        versionCode: !isNaN(buildNum) && buildNum > 0 ? buildNum : CURRENT_APP_VERSION.versionCode,
        versionName: info.version || CURRENT_APP_VERSION.versionName,
      }
    } catch (e) {
      console.warn('Failed to get native app info:', e)
    }
  }
  return CURRENT_APP_VERSION
}

/**
 * Checks Supabase `app_versions` table for newer releases.
 * Compares latest remote `version_code` against actual installed `versionCode`.
 * Returns the latest version info if a newer version exists, else null.
 */
export async function checkForAppUpdate(): Promise<AppVersionInfo | null> {
  try {
    const current = await getInstalledAppVersion()
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .order('version_code', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return null
    }

    const latest = data[0] as AppVersionInfo
    // Only trigger update prompt if remote version is strictly greater than current
    if (latest.version_code > current.versionCode) {
      return latest
    }

    return null
  } catch (err) {
    console.warn('Failed to check app update:', err)
    return null
  }
}
