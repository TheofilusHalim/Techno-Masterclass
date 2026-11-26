import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle2, MapPin, Bell, Trash2 } from 'lucide-react'
import { useStore, type AppNotification } from '../store/useStore'
import { useTranslation } from '../utils/i18n'

export function Notifications() {
  const navigate = useNavigate()
  const { notifications, clearNotifications, markNotificationsRead } = useStore()
  const { t } = useTranslation()

  // Mark read when screen opens safely inside useEffect
  useEffect(() => {
    markNotificationsRead()
  }, [markNotificationsRead])

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'warning':
        return { Icon: Clock, iconColor: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' }
      case 'success':
        return { Icon: CheckCircle2, iconColor: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
      case 'error':
        return { Icon: Clock, iconColor: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
      default:
        return { Icon: MapPin, iconColor: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' }
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors"
            >
              <ArrowLeft size={18} className="text-white" />
            </button>
            <h1 className="text-white text-xl font-bold">{t('notifTitle')}</h1>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="p-2 rounded-full bg-green-800/80 hover:bg-green-600 text-green-100 text-xs flex items-center gap-1 transition-all"
              title="Bersihkan riwayat notifikasi"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto">
        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Bell size={30} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-700">{t('notifEmpty')}</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">{t('notifEmptySub')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const { Icon, iconColor, bgColor, borderColor } = getIconForType(item.type)
              return (
                <div key={item.id} className={`${bgColor} border ${borderColor} rounded-2xl p-4 shadow-2xs`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-xs">
                      <Icon size={18} className={iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{item.timeAgo}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.message}</p>
                      {item.action && item.actionLabel && (
                        <button
                          onClick={() => navigate(item.action!)}
                          className="mt-2 text-xs font-bold text-green-700 hover:text-green-800 underline-offset-2 hover:underline inline-flex items-center gap-1"
                        >
                          {item.actionLabel} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
