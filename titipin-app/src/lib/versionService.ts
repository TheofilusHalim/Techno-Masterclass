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

// Current installed app version
export const CURRENT_APP_VERSION = {
  versionCode: 102,
  versionName: '1.0.2',
}

/**
 * Checks Supabase `app_versions` table for newer releases.
 * Returns the latest version info if a newer version exists, else null.
 */
export async function checkForAppUpdate(): Promise<AppVersionInfo | null> {
  try {
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .order('version_code', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return null
    }

    const latest = data[0] as AppVersionInfo
    if (latest.version_code > CURRENT_APP_VERSION.versionCode) {
      return latest
    }

    return null
  } catch (err) {
    console.warn('Failed to check app update:', err)
    return null
  }
}
