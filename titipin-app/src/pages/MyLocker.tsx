import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Unlock, Package, CheckCircle2, AlertTriangle, Camera, ShieldCheck, Sparkles, Loader2, PackageOpen } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatTime } from '../utils/time'
import { fetchFinishedBookings } from '../lib/lockerService'
import type { Booking } from '../lib/database.types'
import { useTranslation } from '../utils/i18n'

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

function getOverdueDetails(expiresAt?: string | null) {
  if (!expiresAt) return { minutes: 0, fee: 0 }
  const diffMs = Date.now() - new Date(expiresAt).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes <= 0) return { minutes: 0, fee: 0 }
  const fee = minutes <= 30 ? 2000 : 2000 + Math.ceil((minutes - 30) / 30) * 1000
  return { minutes, fee }
}

export function MyLocker() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active')
  const [extendToast, setExtendToast] = useState<string | null>(null)
  const [finishedBookings, setFinishedBookings] = useState<Booking[]>([])
  const [loadingFinished, setLoadingFinished] = useState(false)
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [showPayFineModal, setShowPayFineModal] = useState(false)
  const [finePaymentMethod, setFinePaymentMethod] = useState('QRIS')
  const [, setNowTick] = useState(() => Date.now())
  const { t, language } = useTranslation()
  const {
    hasActiveLocker,
    activeBooking,
    activeBookings,
    selectActiveBooking,
    lockerNumber,
    lockerSize,
    lockerLocation,
    remainingSeconds,
    tickLockerTimer,
    extendLocker,
    retrieveItems,
    loadActiveBooking,
    userId,
    isOverdue,
  } = useStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadActiveBooking(userId || undefined)
  }, [loadActiveBooking, userId])

  useEffect(() => {
    const loadFinished = async () => {
      setLoadingFinished(true)
      try {
        const { data } = await fetchFinishedBookings(userId || undefined)
        setFinishedBookings(data || [])
      } catch (err) {
        console.warn('Failed to load finished bookings:', err)
      } finally {
        setLoadingFinished(false)
      }
    }

    if (activeTab === 'finished') {
      loadFinished()
    }
  }, [activeTab, userId])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickLockerTimer()
      setNowTick(Date.now())
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tickLockerTimer])

  // Reminder alert when time <= 10 minutes (600 seconds)
  const handleExtend = (idx?: number) => {
    if (typeof idx === 'number' && activeBookings[idx]) {
      selectActiveBooking(idx)
    }
    extendLocker()
    setExtendToast('+1 Jam berhasil ditambahkan! Timer telah diperpanjang.')
    setTimeout(() => {
      setExtendToast(null)
    }, 4000)
  }

  const overdueInfo = getOverdueDetails(activeBooking?.expires_at)

  const handleRetrieveItems = async (idx?: number) => {
    let targetBooking = activeBooking
    if (typeof idx === 'number' && activeBookings[idx]) {
      selectActiveBooking(idx)
      targetBooking = activeBookings[idx]
    }
    const targetOverdue = getOverdueDetails(targetBooking?.expires_at)
    if (targetOverdue.fee > 0) {
      // Wajib bayar denda dulu sebelum pintu loker dibuka
      setShowPayFineModal(true)
      return
    }
    setIsRetrieving(true)
    const releasedLocker = targetBooking?.locker?.locker_number || lockerNumber
    const result = await retrieveItems()
    setIsRetrieving(false)
    if (result.success) {
      setExtendToast(`Pintu Loker ${releasedLocker} terbuka! Silakan ambil barang Anda.`)
      setTimeout(() => setExtendToast(null), 5000)
    }
  }

  const handlePayFineAndUnlock = async () => {
    setIsRetrieving(true)
    const releasedLocker = lockerNumber
    const result = await retrieveItems(finePaymentMethod)
    setIsRetrieving(false)
    setShowPayFineModal(false)
    if (result.success) {
      setExtendToast(`Denda lunas (${formatIDR(result.lateFee || overdueInfo.fee)})! Pintu Loker ${releasedLocker} terbuka, silakan ambil barang Anda.`)
      setTimeout(() => setExtendToast(null), 5000)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5 text-white">
        <h1 className="text-2xl font-black mb-4 tracking-tight">{t('lockerTitle')}</h1>

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
              {tab === 'active' ? t('lockerActiveTab') : t('lockerFinishedTab')}
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
            <div className="space-y-5">
              {/* Vertical list of ALL active lockers */}
              {(activeBookings.length > 0
                ? activeBookings
                : [
                    {
                      id: 'local-active',
                      expires_at: new Date(Date.now() + remainingSeconds * 1000).toISOString(),
                      status: isOverdue ? 'overdue' : 'active',
                      locker: { locker_number: lockerNumber, size: lockerSize },
                      hub: { name: lockerLocation },
                    } as any,
                  ]
              ).map((b, idx) => {
                const bLockerNum = b.locker?.locker_number || lockerNumber
                const bSize = b.locker?.size || lockerSize
                const bLocation = b.hub?.name || lockerLocation
                const bRemaining = Math.max(0, Math.floor((new Date(b.expires_at).getTime() - Date.now()) / 1000))
                const bAlmostUp = bRemaining <= 600 && bRemaining > 0
                const bOverdue = b.status === 'overdue' || (bRemaining === 0 && b.status !== 'finished')

                return (
                  <div key={b.id || idx} className="space-y-3">
                    {/* 10-Minute Reminder Alert with 1-tap Extend */}
                    {bAlmostUp && (
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-lg border border-amber-400">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white/20 rounded-xl flex-shrink-0 mt-0.5">
                            <AlertTriangle size={20} className="text-white animate-bounce" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-extrabold text-sm text-white">Peringatan: Waktu Hampir Habis!</p>
                              <span className="text-[11px] bg-black/25 px-2 py-0.5 rounded-full font-mono font-bold text-amber-100 whitespace-nowrap">
                                {Math.ceil(bRemaining / 60)} menit lagi
                              </span>
                            </div>
                            <p className="text-xs text-amber-50 mt-1 leading-relaxed">
                              Loker <strong>{bLockerNum}</strong> akan segera berakhir. Perpanjang sekarang agar terhindar dari penalti/denda!
                            </p>
                            <button
                              onClick={() => handleExtend(idx)}
                              className="mt-3 w-full py-2.5 bg-white text-amber-800 font-extrabold text-xs rounded-xl shadow-sm hover:bg-amber-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Plus size={14} className="stroke-[3]" />
                              Perpanjang Sekarang (+1 Jam • Rp3.000)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overdue Banner — Waktu habis, barang belum diambil */}
                    {bOverdue && (
                      <div className="bg-rose-900/90 border border-rose-500 text-white rounded-2xl p-4 shadow-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={22} className="flex-shrink-0 text-rose-300 animate-pulse" />
                          <div>
                            <p className="font-bold text-sm text-rose-100">
                              Loker {bLockerNum}: Waktu Sewa Habis — Barang Masih Di Dalam
                            </p>
                            <p className="text-xs text-rose-300 mt-0.5">
                              Denda keterlambatan mulai berjalan. Lunasi denda & ambil barang Anda segera.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRetrieveItems(idx)}
                          disabled={isRetrieving}
                          className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-md"
                        >
                          {isRetrieving ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <PackageOpen size={16} />
                          )}
                          {isRetrieving ? 'Memproses...' : 'Buka Loker & Ambil Barang'}
                        </button>
                        <button
                          onClick={() => handleExtend(idx)}
                          className="w-full py-2.5 rounded-xl border border-amber-400/60 text-amber-300 font-semibold text-sm hover:bg-amber-400/10 active:scale-95 transition-all"
                        >
                          <Plus size={13} className="inline mr-1" />
                          Perpanjang Sewa (+1 Jam • Rp3.000)
                        </button>
                      </div>
                    )}

                    {/* Active Locker Main Card */}
                    <div className="bg-gradient-to-br from-green-700 via-green-800 to-green-900 rounded-3xl p-5 text-white shadow-xl border border-green-600/30">
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            bOverdue ? 'bg-rose-500/80 text-white' : 'bg-green-600/60 text-green-200'
                          }`}>
                            <Sparkles size={10} /> {bOverdue ? 'Overdue • Menunggu Pengambilan' : 'Sesi Loker Aktif'}
                          </span>
                          <p className="text-3xl font-black mt-1">Loker {bLockerNum}</p>
                          <p className="text-green-200 text-xs mt-1 font-medium">
                            Ukuran {bSize} • {bLocation}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                          <Package size={26} className="text-white" />
                        </div>
                      </div>

                      {/* Live Countdown Timer */}
                      <div className="text-center py-4 px-3 bg-black/20 rounded-2xl mb-5 border border-white/10">
                        <p className="text-green-300 text-[11px] uppercase tracking-wider font-bold mb-1">
                          {bOverdue ? 'Status Loker' : 'Sisa Waktu Pemakaian'}
                        </p>
                        <p
                          className={`text-5xl font-black font-mono tracking-tight ${
                            bOverdue
                              ? 'text-rose-400 animate-pulse'
                              : bAlmostUp
                              ? 'text-amber-300 animate-pulse'
                              : 'text-white'
                          }`}
                        >
                          {bOverdue ? 'TERLAMBAT' : formatTime(bRemaining)}
                        </p>
                        <p className="text-[10px] text-green-200/80 mt-1">
                          {bOverdue ? 'Denda berjalan — segera ambil barang' : 'Sinkronisasi IoT Real-time Supabase'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleExtend(idx)}
                          className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 rounded-2xl font-black text-xs shadow-md transition-all min-h-[50px]"
                        >
                          <div className="flex items-center gap-1">
                            <Plus size={16} className="stroke-[3]" />
                            <span>Extend +1 hr</span>
                          </div>
                          <span className="text-[9px] font-bold text-amber-900 bg-amber-300/80 px-2 py-0.5 rounded-full">
                            {bOverdue ? 'Tambah +1 Jam' : 'Bebas Denda'}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            if (bOverdue) {
                              handleRetrieveItems(idx)
                              return
                            }
                            if (activeBookings[idx]) selectActiveBooking(idx)
                            navigate('/my-qr')
                          }}
                          className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl font-bold text-xs transition-all shadow-md min-h-[50px] ${
                            bOverdue
                              ? 'bg-rose-500 text-white hover:bg-rose-400 active:scale-95'
                              : 'bg-white text-green-800 hover:bg-green-50 active:scale-95'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {bOverdue ? <Unlock size={16} /> : <Camera size={16} />}
                            <span>
                              {bOverdue
                                ? 'Bayar & Buka'
                                : language === 'en'
                                ? 'Scan QR'
                                : 'Scan QR Loker'}
                            </span>
                          </div>
                          <span className={`text-[9px] font-medium ${bOverdue ? 'text-rose-100' : 'text-gray-500'}`}>
                            {bOverdue
                              ? 'Wajib Lunasi Denda'
                              : language === 'en'
                              ? 'Unlock via QR'
                              : 'Buka via QR'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

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
                      {t('lockerScanQrBtn')}
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.2 rounded-md">
                        {language === 'en' ? 'Camera' : 'Kamera'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {t('lockerScanQrSub')}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-emerald-800 font-bold bg-white border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs whitespace-nowrap">
                  {t('lockerOpenScanner')}
                </span>
              </button>

              {/* Anti-fine guarantee card */}
              <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
                <ShieldCheck size={20} className="text-green-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  {t('lockerPolicy')}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Package size={32} />
              </div>
              <p className="text-gray-800 font-bold text-base">{t('lockerNoActive')}</p>
              <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto">
                {t('lockerNoActiveSub')}
              </p>
              <button
                onClick={() => navigate('/nearby-lockers')}
                className="mt-5 px-6 py-3 bg-green-700 text-white rounded-2xl text-xs font-bold hover:bg-green-800 active:scale-95 transition-all shadow-md"
              >
                {t('lockerFindAndBook')}
              </button>
            </div>
          )
        ) : loadingFinished ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="animate-spin text-green-700" size={24} />
            <span className="text-xs">Memuat riwayat loker...</span>
          </div>
        ) : finishedBookings.length > 0 ? (
          <div className="space-y-3">
            {finishedBookings.map((b) => {
              const lockerNum = b.locker?.locker_number || 'M-07'
              const lockerSz = b.locker?.size || 'M'
              const locName = b.hub?.name || 'Titipin Hub'
              const dateStr = b.created_at
                ? new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Hari ini'
              const durationStr = `${b.hours_booked || 1} jam`
              const amtStr = formatIDR(b.amount_paid || 0)

              return (
                <div key={b.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={18} className="text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Loker {lockerNum} <span className="text-xs font-semibold text-gray-500">(Size {lockerSz})</span>
                        </p>
                        <p className="text-xs text-gray-500">{locName}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {dateStr} • Durasi {durationStr}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-gray-900">{amtStr}</span>
                      <span className={`block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        b.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {b.status === 'cancelled' ? 'Dibatalkan' : 'Selesai'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-sm font-bold text-gray-700">Belum Ada Riwayat Selesai</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Riwayat pemakaian loker yang telah selesai akan muncul di sini.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Bayar Denda Dulu Sebelum Buka Loker */}
      {showPayFineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-gray-900 font-extrabold text-base">Pembayaran Denda Overdue</h3>
                <p className="text-xs text-gray-500">
                  Loker {lockerNumber} • Terlambat {overdueInfo.minutes} menit
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-semibold text-rose-700">Total Denda yang Harus Dibayar</p>
              <p className="text-3xl font-black text-rose-600 mt-1">
                {formatIDR(overdueInfo.fee)}
              </p>
              <p className="text-[11px] text-rose-500 mt-1">
                Pintu loker akan terbuka otomatis setelah pembayaran berhasil.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-700">Pilih Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {(['QRIS', 'E-Wallet', 'VA Bank'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFinePaymentMethod(method)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      finePaymentMethod === method
                        ? 'bg-green-700 text-white border-green-700 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handlePayFineAndUnlock}
                disabled={isRetrieving}
                className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-all shadow-md"
              >
                {isRetrieving ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                {isRetrieving ? 'Memproses Pembayaran...' : `Bayar ${formatIDR(overdueInfo.fee)} & Buka Loker`}
              </button>
              <button
                onClick={() => setShowPayFineModal(false)}
                disabled={isRetrieving}
                className="w-full py-2.5 rounded-xl text-gray-500 font-bold text-xs hover:bg-gray-100 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
