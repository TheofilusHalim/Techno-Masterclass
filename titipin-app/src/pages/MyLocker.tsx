import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Unlock, Package, CheckCircle2, AlertTriangle, Camera, ShieldCheck, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatTime } from '../utils/time'

export function MyLocker() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active')
  const [extendToast, setExtendToast] = useState<string | null>(null)
  const {
    hasActiveLocker,
    activeBookings,
    selectedActiveBookingIndex,
    selectActiveBooking,
    lockerNumber,
    lockerSize,
    lockerLocation,
    remainingSeconds,
    tickLockerTimer,
    extendLocker,
    triggerUnlock,
    isDoorOpen,
    loadActiveBooking,
    userId,
  } = useStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadActiveBooking(userId || undefined)
  }, [loadActiveBooking, userId])

  useEffect(() => {
    intervalRef.current = setInterval(() => tickLockerTimer(), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tickLockerTimer])

  // Reminder alert when time <= 10 minutes (600 seconds)
  const isAlmostUp = remainingSeconds <= 600 && remainingSeconds > 0
  const isExpired = remainingSeconds === 0

  const handleExtend = () => {
    extendLocker()
    setExtendToast('+1 Jam berhasil ditambahkan! Timer telah diperpanjang.')
    setTimeout(() => {
      setExtendToast(null)
    }, 4000)
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5 text-white">
        <h1 className="text-2xl font-black mb-4 tracking-tight">Loker Saya</h1>

        {/* Tabs */}
        <div className="flex gap-2 bg-green-800/80 p-1 rounded-xl max-w-xs border border-green-600/40">
          {(['active', 'finished'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white text-green-800 shadow-sm'
                  : 'text-green-200 hover:text-white'
              }`}
            >
              {tab === 'active' ? 'Loker Aktif' : 'Riwayat Selesai'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 overflow-y-auto">
        {/* Toast confirmation */}
        {extendToast && (
          <div className="mb-4 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl flex items-center justify-between shadow-md animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{extendToast}</span>
            </div>
            <button onClick={() => setExtendToast(null)} className="text-white/80 hover:text-white text-sm">
              ✕
            </button>
          </div>
        )}

        {activeTab === 'active' ? (
          hasActiveLocker ? (
            <div className="space-y-4">
              {/* Multiple active lockers switcher */}
              {activeBookings && activeBookings.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
                  {activeBookings.map((b, idx) => (
                    <button
                      key={b.id || idx}
                      onClick={() => selectActiveBooking(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        selectedActiveBookingIndex === idx
                          ? 'bg-green-700 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Package size={13} />
                      <span>Loker {b.locker?.locker_number || `#${idx + 1}`}</span>
                      <span className="text-[10px] opacity-75">({b.locker?.size || 'M'})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 10-Minute Reminder Alert with 1-tap Extend */}
              {isAlmostUp && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-lg border border-amber-400">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-xl flex-shrink-0 mt-0.5">
                      <AlertTriangle size={20} className="text-white animate-bounce" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-extrabold text-sm text-white">Peringatan: Waktu Hampir Habis!</p>
                        <span className="text-[11px] bg-black/25 px-2 py-0.5 rounded-full font-mono font-bold text-amber-100 whitespace-nowrap">
                          {Math.ceil(remainingSeconds / 60)} menit lagi
                        </span>
                      </div>
                      <p className="text-xs text-amber-50 mt-1 leading-relaxed">
                        Loker <strong>{lockerNumber}</strong> akan segera berakhir. Perpanjang sekarang agar terhindar dari penalti/denda!
                      </p>
                      <button
                        onClick={handleExtend}
                        className="mt-3 w-full py-2.5 bg-white text-amber-800 font-extrabold text-xs rounded-xl shadow-sm hover:bg-amber-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus size={14} className="stroke-[3]" />
                        Perpanjang Sekarang (+1 Jam • Rp3.000)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Expired warning */}
              {isExpired && (
                <div className="bg-rose-600 text-white rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={24} className="flex-shrink-0 animate-pulse" />
                    <div>
                      <p className="font-bold text-sm">Waktu Sewa Loker Berakhir</p>
                      <p className="text-xs text-rose-100 mt-0.5">
                        Kebijakan No-Fine kami mengizinkan perpanjangan instan tanpa denda tambahan.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExtend}
                    className="mt-3 w-full py-2.5 bg-white text-rose-700 font-extrabold text-xs rounded-xl shadow-sm hover:bg-rose-50 active:scale-95 transition-all"
                  >
                    Perpanjang +1 Jam Sekarang
                  </button>
                </div>
              )}

              {/* Active Locker Main Card */}
              <div className="bg-gradient-to-br from-green-700 via-green-800 to-green-900 rounded-3xl p-5 text-white shadow-xl border border-green-600/30">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="inline-flex items-center gap-1 bg-green-600/60 text-green-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      <Sparkles size={10} /> Sesi Loker Aktif
                    </span>
                    <p className="text-3xl font-black mt-1">Loker {lockerNumber}</p>
                    <p className="text-green-200 text-xs mt-1 font-medium">
                      Ukuran {lockerSize} • {lockerLocation}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                    <Package size={26} className="text-white" />
                  </div>
                </div>

                {/* Live Countdown Timer */}
                <div className="text-center py-4 px-3 bg-black/20 rounded-2xl mb-5 border border-white/10">
                  <p className="text-green-300 text-[11px] uppercase tracking-wider font-bold mb-1">
                    Sisa Waktu Pemakaian
                  </p>
                  <p
                    className={`text-5xl font-black font-mono tracking-tight ${
                      isAlmostUp || isExpired ? 'text-amber-300 animate-pulse' : 'text-white'
                    }`}
                  >
                    {formatTime(remainingSeconds)}
                  </p>
                  <p className="text-[10px] text-green-200/80 mt-1">
                    Sinkronisasi IoT Real-time Supabase
                  </p>
                </div>

                {/* Anti-Fine & Extend Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* High contrast Extend +1 hr anti-fine button */}
                  <button
                    onClick={handleExtend}
                    className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 rounded-2xl font-black text-xs shadow-md transition-all min-h-[50px]"
                  >
                    <div className="flex items-center gap-1">
                      <Plus size={16} className="stroke-[3]" />
                      <span>Extend +1 hr</span>
                    </div>
                    <span className="text-[9px] font-bold text-amber-900 bg-amber-300/80 px-2 py-0.5 rounded-full">
                      Bebas Denda
                    </span>
                  </button>

                  {/* Remote Unlock Button */}
                  <button
                    onClick={() => triggerUnlock('Tombol Buka Loker di Aplikasi', 'REMOTE_APP')}
                    disabled={isDoorOpen}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl font-bold text-xs transition-all shadow-md min-h-[50px] ${
                      isDoorOpen
                        ? 'bg-emerald-300 text-emerald-950 font-black animate-pulse border-2 border-emerald-400'
                        : 'bg-white text-green-800 hover:bg-green-50 active:scale-95'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Unlock size={16} className={isDoorOpen ? 'animate-bounce' : ''} />
                      <span>{isDoorOpen ? 'Pintu Terbuka' : 'Buka Loker'}</span>
                    </div>
                    <span className="text-[9px] text-gray-500 font-medium">
                      {isDoorOpen ? 'Auto-lock 5s' : 'Remote Unlock'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Primary 'Scan Locker QR' Button */}
              <button
                onClick={() => navigate('/my-qr')}
                className="w-full flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl hover:bg-emerald-100/80 active:scale-[0.99] transition-all shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <Camera size={22} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                      Scan Locker QR
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.2 rounded-md">
                        Kamera
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Arahkan kamera ke layar LCD loker untuk membuka pintu
                    </p>
                  </div>
                </div>
                <span className="text-xs text-emerald-800 font-bold bg-white border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs whitespace-nowrap">
                  Buka Scanner →
                </span>
              </button>

              {/* Anti-fine guarantee card */}
              <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
                <ShieldCheck size={20} className="text-green-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-900">Kebijakan Titipin:</strong> Tidak ada denda terlambat jika Anda memperpanjang sebelum pintu dikunci kembali. Tetap fleksibel sesuai jadwal Anda!
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Package size={32} />
              </div>
              <p className="text-gray-800 font-bold text-base">Tidak ada loker aktif</p>
              <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto">
                Pesan loker pintar sekarang di stasiun, kampus, atau pusat perbelanjaan terdekat.
              </p>
              <button
                onClick={() => navigate('/nearby-lockers')}
                className="mt-5 px-6 py-3 bg-green-700 text-white rounded-2xl text-xs font-bold hover:bg-green-800 active:scale-95 transition-all shadow-md"
              >
                Cari & Pesan Loker
              </button>
            </div>
          )
        ) : (
          /* Finished Tab: Transaction / Completed rentals list */
          <div className="space-y-3">
            {[
              { num: 'M-07', loc: 'Petra Christian University', date: 'Hari ini', dur: '2 jam', amt: 'Rp6.000', size: 'M' },
              { num: 'S-03', loc: 'Gubeng Station', date: '14 Nov 2026', dur: '1 jam', amt: 'Rp2.000', size: 'S' },
              { num: 'M-04', loc: 'Tunjungan Plaza', date: '10 Nov 2026', dur: '3 jam', amt: 'Rp9.000', size: 'M' },
              { num: 'L-01', loc: 'Petra Library Hub', date: '5 Nov 2026', dur: '2 jam', amt: 'Rp10.000', size: 'L' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={18} className="text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Loker {item.num} <span className="text-xs font-semibold text-gray-500">(Size {item.size})</span>
                      </p>
                      <p className="text-xs text-gray-500">{item.loc}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {item.date} • Durasi {item.dur}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-gray-900">{item.amt}</span>
                    <span className="block text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                      Selesai
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
