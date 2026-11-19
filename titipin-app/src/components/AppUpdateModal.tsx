import { Sparkles, Download, ArrowUpCircle } from 'lucide-react'
import type { AppVersionInfo } from '../lib/versionService'
import { CURRENT_APP_VERSION } from '../lib/versionService'
import { useTranslation } from '../utils/i18n'

interface AppUpdateModalProps {
  updateInfo: AppVersionInfo
  isOpen: boolean
  onClose: () => void
}

export function AppUpdateModal({ updateInfo, isOpen, onClose }: AppUpdateModalProps) {
  const { language } = useTranslation()

  if (!isOpen) return null

  const handleDownloadAndInstall = () => {
    // Open APK download URL in mobile browser or system downloader
    window.open(updateInfo.apk_url, '_system')
  }

  const notes = updateInfo.release_notes
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-green-200">
        {/* Header with decorative badge */}
        <div className="bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-3">
            <ArrowUpCircle size={32} className="text-amber-300 animate-pulse" />
          </div>
          <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5 shadow-xs">
            <Sparkles size={11} />
            {language === 'en' ? 'New Update Available' : 'Pembaruan Tersedia'}
          </span>
          <h2 className="text-xl font-black tracking-tight">{updateInfo.title || 'Titipin App Update'}</h2>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-green-200 font-mono">
            <span className="bg-black/25 px-2 py-0.5 rounded-md">v{CURRENT_APP_VERSION.versionName}</span>
            <span>→</span>
            <span className="bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-md">v{updateInfo.version_name}</span>
          </div>
        </div>

        {/* Content & Release Notes */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-2">
              {language === 'en' ? 'What’s New in this version:' : 'Apa yang Baru di Versi Ini:'}
            </p>
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-2 max-h-48 overflow-y-auto">
              {notes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>{note.replace(/^[•\-*]\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-gray-500 text-center leading-relaxed">
            {language === 'en'
              ? 'Tap below to download and install the update directly on your phone.'
              : 'Sentuh tombol di bawah untuk mengunduh dan memasang update langsung di HP Anda.'}
          </p>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleDownloadAndInstall}
              className="w-full py-3.5 bg-green-700 text-white rounded-2xl font-bold text-xs hover:bg-green-800 active:scale-95 transition-all shadow-md shadow-green-700/30 flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>{language === 'en' ? 'Download & Install Now' : 'Unduh & Pasang Sekarang'}</span>
            </button>

            {!updateInfo.is_critical && (
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs transition-colors"
              >
                {language === 'en' ? 'Later' : 'Nanti Saja'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
