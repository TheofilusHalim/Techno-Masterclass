import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, ChevronRight, Package,
  HelpCircle, MessageSquare, Navigation, Loader2
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatTime } from '../utils/time'
import { fetchHubsWithAvailability, type HubWithStats } from '../lib/lockerService'
import { supabase } from '../lib/supabase'
import { LiveMap } from '../components/LiveMap'
import { useTranslation } from '../utils/i18n'

export function Home() {
  const navigate = useNavigate()
  const {
    userName,
    isAuthenticated,
    hasActiveLocker,
    activeBookings,
    lockerNumber,
    remainingSeconds,
    unreadNotifications,
    setSelectedHub,
    setConnectionStatus,
  } = useStore()

  const { t, language } = useTranslation()

  const [hubs, setHubs] = useState<HubWithStats[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const { data, error } = await fetchHubsWithAvailability()
    if (error) {
      setConnectionStatus('error', error)
    } else {
      setConnectionStatus('connected')
      setHubs(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    // Realtime listener on lockers table: reload availability automatically
    const channel = supabase
      .channel('home:lockers_listener')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lockers' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const nearestHub = hubs[0]

  const handleSelectNearest = () => {
    if (nearestHub) {
      setSelectedHub(nearestHub.name, nearestHub.id)
    }
    navigate('/hub-detail')
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 via-green-700 to-green-800 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-green-100 text-xs">
            <Navigation size={13} />
            <span>Surabaya — Petra Christian University</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors"
            >
              <Bell size={18} className="text-white" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Profile Avatar / Sign In Button */}
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/account')}
                className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-400 border border-green-300 flex items-center justify-center text-white text-xs font-bold shadow-xs transition-colors"
              >
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="px-2.5 py-1 bg-white text-green-800 rounded-full text-[11px] font-bold shadow-xs hover:bg-green-50 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-green-200 text-xs font-medium">
              {isAuthenticated
                ? language === 'en'
                  ? `Welcome back, ${userName}`
                  : `Halo, ${userName}`
                : language === 'en'
                ? 'Welcome to Titipin'
                : 'Selamat datang di Titipin'}
            </p>
            <h1 className="text-white text-2xl font-bold mt-0.5">{t('homeFindLocker')}</h1>
          </div>
        </div>
        <p className="text-green-200 text-xs mt-0.5">{t('homeFindLockerSub')}</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Active locker banner */}
        {hasActiveLocker && (
          <button
            onClick={() => navigate('/my-locker')}
            className="w-full flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3 hover:bg-green-100 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center">
                <Package size={18} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-green-600 font-medium">
                  {activeBookings && activeBookings.length > 1
                    ? t('homeMultiActiveLocker', { count: activeBookings.length, units: '' }).split('•')[0]
                    : t('homeActiveLocker')}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {activeBookings && activeBookings.length > 1
                    ? `Unit: ${activeBookings.map((b) => b.locker?.locker_number).filter(Boolean).join(', ')}`
                    : t('homeActiveLockerSub', { number: lockerNumber, time: formatTime(remainingSeconds) })}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-green-600 flex-shrink-0" />
          </button>
        )}

        {/* Real Leaflet Map */}
        <LiveMap hubs={hubs} onSelectHub={(hub) => { setSelectedHub(hub.name, hub.id); navigate('/hub-detail') }} />

        {/* Nearest hub card with live Supabase data */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{t('homeNearestHub')}</p>
              <p className="text-base font-semibold text-gray-800 mt-0.5">
                {nearestHub ? nearestHub.name : 'Petra Christian University'}
              </p>
              <p className="text-xs text-gray-500">
                {nearestHub ? `${nearestHub.sub_location || 'Main Lobby'} • ${nearestHub.distance_km ?? 0.1} km away` : 'Gedung P lobby • 0.1 km away'}
              </p>
            </div>

            {loading ? (
              <Loader2 size={16} className="animate-spin text-green-600 mt-1" />
            ) : (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {nearestHub?.total_available ?? 8} {t('homeFree').toLowerCase()}
              </span>
            )}
          </div>

          {/* S, M, L slot availability badges */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { s: 'S', n: nearestHub?.slots.S ?? 4 },
              { s: 'M', n: nearestHub?.slots.M ?? 3 },
              { s: 'L', n: nearestHub?.slots.L ?? 1 },
            ].map(({ s, n }) => (
              <span
                key={s}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  n > 0 ? 'bg-gray-100 text-gray-700' : 'bg-rose-50 text-rose-600'
                }`}
              >
                Size {s}:{' '}
                <strong className={n > 0 ? 'text-green-700' : 'text-rose-600'}>
                  {n > 0 ? n : language === 'en' ? 'Full' : 'Penuh'}
                </strong>
              </span>
            ))}
          </div>

          <button
            onClick={handleSelectNearest}
            className="w-full mt-3 py-2 bg-green-50 text-green-700 rounded-xl font-semibold text-xs hover:bg-green-100 transition-colors"
          >
            {language === 'en' ? 'Select this hub →' : 'Pilih hub ini →'}
          </button>
        </div>

        {/* Book CTA */}
        <button
          onClick={() => navigate('/nearby-lockers')}
          className="w-full py-4 bg-green-700 text-white rounded-2xl font-semibold text-base shadow-lg shadow-green-700/30 hover:bg-green-800 active:scale-95 transition-all"
        >
          {language === 'en' ? 'Book a locker' : 'Pesan Loker Sekarang'}
        </button>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/faq')}
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
          >
            <HelpCircle size={18} className="text-green-700" />
            <span className="text-sm font-medium text-gray-700">FAQ</span>
          </button>
          <button
            onClick={() => navigate('/live-chat')}
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
          >
            <MessageSquare size={18} className="text-green-700" />
            <span className="text-sm font-medium text-gray-700">Live chat</span>
          </button>
        </div>
      </div>
    </div>
  )
}
