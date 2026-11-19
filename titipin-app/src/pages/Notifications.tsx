import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle2, MapPin, Bell, Trash2, Sparkles, KeyRound } from 'lucide-react'
import { useStore, type AppNotification } from '../store/useStore'
import { useTranslation } from '../utils/i18n'

export function Notifications() {
  const navigate = useNavigate()
  const { notifications, addNotification, clearNotifications, markNotificationsRead } = useStore()
  const { t, language } = useTranslation()

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

  // Simulator helper triggers
  const triggerSimulatePayment = () => {
    addNotification({
      type: 'success',
      title: language === 'en' ? 'Payment Confirmed' : 'Pembayaran Berhasil',
      message:
        language === 'en'
          ? 'Your payment of Rp6,000 for Locker M-07 (Petra Christian University) was successful.'
          : 'Pembayaran sewa Rp6.000 untuk Loker M-07 di Petra Christian University berhasil diverifikasi.',
      timeAgo: 'Baru saja',
      action: '/my-locker',
      actionLabel: language === 'en' ? 'Open My Locker' : 'Buka Loker Saya',
    })
  }

  const triggerSimulateWarning = () => {
    addNotification({
      type: 'warning',
      title: language === 'en' ? 'Warning: Time Almost Up!' : 'Peringatan: Waktu Hampir Habis!',
      message:
        language === 'en'
          ? 'Locker M-07 rental expires in 10 minutes. Extend now to avoid late fines.'
          : 'Sewa Loker M-07 tersisa 10 menit. Segera perpanjang sewa agar terhindar dari denda terlambat.',
      timeAgo: 'Baru saja',
      action: '/my-locker',
      actionLabel: language === 'en' ? 'Extend Now' : 'Perpanjang Sekarang',
    })
  }

  const triggerSimulateUnlock = () => {
    addNotification({
      type: 'info',
      title: language === 'en' ? 'Locker Door Unlocked' : 'Pintu Loker Terbuka',
      message:
        language === 'en'
          ? 'Door for Locker M-07 has been unlocked remotely via app. Please close firmly when finished.'
          : 'Pintu Loker M-07 berhasil dibuka melalui aplikasi. Harap tutup rapat setelah mengambil barang.',
      timeAgo: 'Baru saja',
      action: '/my-locker',
      actionLabel: language === 'en' ? 'Check Status' : 'Lihat Status',
    })
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
        {/* Interactive Notification Testing Simulator */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-green-700" />
            <p className="text-xs font-bold text-green-900">{t('notifSimulatorTitle')}</p>
          </div>
          <p className="text-[11px] text-gray-600 mb-2.5">
            {language === 'en'
              ? 'Tap any button below to trigger and test simulated real-time notifications:'
              : 'Sentuh tombol di bawah untuk memicu dan menguji sistem notifikasi secara instan:'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={triggerSimulatePayment}
              className="px-2 py-2 bg-white border border-green-300 rounded-xl text-[10px] font-bold text-green-800 hover:bg-green-50 active:scale-95 shadow-xs transition-all flex flex-col items-center gap-1"
            >
              <CheckCircle2 size={14} className="text-green-600" />
              <span className="text-center leading-tight">{t('notifSimulatePayment')}</span>
            </button>
            <button
              onClick={triggerSimulateWarning}
              className="px-2 py-2 bg-white border border-orange-300 rounded-xl text-[10px] font-bold text-orange-800 hover:bg-orange-50 active:scale-95 shadow-xs transition-all flex flex-col items-center gap-1"
            >
              <Clock size={14} className="text-orange-500" />
              <span className="text-center leading-tight">{t('notifSimulateWarning')}</span>
            </button>
            <button
              onClick={triggerSimulateUnlock}
              className="px-2 py-2 bg-white border border-blue-300 rounded-xl text-[10px] font-bold text-blue-800 hover:bg-blue-50 active:scale-95 shadow-xs transition-all flex flex-col items-center gap-1"
            >
              <KeyRound size={14} className="text-blue-500" />
              <span className="text-center leading-tight">{t('notifSimulateUnlock')}</span>
            </button>
          </div>
        </div>

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
