import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle2, MapPin } from 'lucide-react'
import { useStore } from '../store/useStore'

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'warning',
    icon: Clock,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: 'Time is almost up',
    message: 'Locker M-07 closes in 10 minutes. Extend now to avoid a fine.',
    time: '5 min ago',
    action: '/my-locker',
    actionLabel: 'Extend now',
  },
  {
    id: 2,
    type: 'success',
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'Payment confirmed',
    message: 'Your payment of Rp6.000 for Locker M-07 has been received successfully.',
    time: '2 hrs ago',
    action: null,
    actionLabel: null,
  },
  {
    id: 3,
    type: 'info',
    icon: MapPin,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'New Hub opened!',
    message: 'Titipin is now available at ITS Surabaya — Gedung Rektorat. 20 lockers ready.',
    time: '1 day ago',
    action: '/nearby-lockers',
    actionLabel: 'View hub',
  },
]

export function Notifications() {
  const navigate = useNavigate()
  const { markNotificationsRead } = useStore()

  // Mark read when screen opens
  markNotificationsRead()

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">Notifications</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-3">
        {NOTIFICATIONS.map(({ id, icon: Icon, iconColor, bgColor, borderColor, title, message, time, action, actionLabel }) => (
          <div key={id} className={`${bgColor} border ${borderColor} rounded-2xl p-4`}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon size={18} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{time}</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{message}</p>
                {action && actionLabel && (
                  <button
                    onClick={() => navigate(action)}
                    className="mt-2 text-xs font-semibold text-green-700 hover:text-green-800 underline-offset-2 hover:underline"
                  >
                    {actionLabel} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
