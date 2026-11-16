import { useNavigate } from 'react-router-dom'
import {
  MapPin, Bell, ChevronRight, Package,
  HelpCircle, MessageSquare, Navigation
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatTime } from '../utils/time'

// Simple SVG map placeholder with green pins
function MapView() {
  return (
    <div className="relative w-full h-48 bg-gradient-to-b from-green-50 to-emerald-100 rounded-2xl overflow-hidden border border-green-200">
      {/* Grid lines to simulate map */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        {[...Array(6)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={`${(i + 1) * 16}%`} x2="100%" y2={`${(i + 1) * 16}%`} stroke="#166534" strokeWidth="1" />
        ))}
        {[...Array(8)].map((_, i) => (
          <line key={`v${i}`} x1={`${(i + 1) * 12}%`} y1="0" x2={`${(i + 1) * 12}%`} y2="100%" stroke="#166534" strokeWidth="1" />
        ))}
        {/* Roads */}
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#166534" strokeWidth="3" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#166534" strokeWidth="3" />
        <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#166534" strokeWidth="2" />
      </svg>

      {/* Map pins */}
      <MapPin className="absolute text-green-700" style={{ top: '30%', left: '28%', transform: 'translate(-50%,-100%)' }} size={28} fill="#dcfce7" />
      <MapPin className="absolute text-green-600" style={{ top: '55%', left: '68%', transform: 'translate(-50%,-100%)' }} size={22} fill="#dcfce7" />
      <MapPin className="absolute text-green-500" style={{ top: '72%', left: '45%', transform: 'translate(-50%,-100%)' }} size={20} fill="#dcfce7" />

      {/* Availability badges on pins */}
      <span className="absolute bg-green-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ top: '10%', left: '21%' }}>8</span>
      <span className="absolute bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ top: '35%', left: '61%' }}>12</span>
      <span className="absolute bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ top: '55%', left: '38%' }}>4</span>

      {/* Current location dot */}
      <div className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" style={{ top: '42%', left: '42%', transform: 'translate(-50%,-50%)' }}>
        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-60" />
      </div>

      {/* Map label */}
      <span className="absolute bottom-2 right-2 text-[10px] text-green-800 bg-white/80 px-2 py-0.5 rounded-full font-medium">
        📍 Surabaya
      </span>
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()
  const { hasActiveLocker, lockerNumber, remainingSeconds, unreadNotifications } = useStore()

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-green-100 text-sm">
            <Navigation size={14} />
            <span>Surabaya — Petra Christian University</span>
          </div>
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
        </div>
        <h1 className="text-white text-2xl font-bold">Find a locker</h1>
        <p className="text-green-200 text-sm mt-0.5">Smart storage, anywhere in Surabaya</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Active locker banner */}
        {hasActiveLocker && (
          <button
            onClick={() => navigate('/my-locker')}
            className="w-full flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3 hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center">
                <Package size={18} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-green-600 font-medium">Active locker</p>
                <p className="text-sm font-semibold text-gray-800">
                  Locker {lockerNumber} is active • {formatTime(remainingSeconds)}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-green-600 flex-shrink-0" />
          </button>
        )}

        {/* Map */}
        <MapView />

        {/* Nearest hub card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Nearest Hub</p>
              <p className="text-base font-semibold text-gray-800 mt-0.5">Petra Christian University</p>
              <p className="text-xs text-gray-500">Gedung P lobby • 0.1 km away</p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
              8 free
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            {[{ s: 'S', n: 4 }, { s: 'M', n: 3 }, { s: 'L', n: 1 }].map(({ s, n }) => (
              <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                {s} {n}
              </span>
            ))}
          </div>
        </div>

        {/* Book CTA */}
        <button
          onClick={() => navigate('/nearby-lockers')}
          className="w-full py-4 bg-green-700 text-white rounded-2xl font-semibold text-base shadow-lg shadow-green-700/30 hover:bg-green-800 active:scale-95 transition-all"
        >
          Book a locker
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
