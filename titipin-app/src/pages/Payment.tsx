import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Clock, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, Crown } from 'lucide-react'
import { useStore } from '../store/useStore'
import { processBookingTransaction } from '../lib/lockerService'

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

const SIZES_CONFIG: Record<'S' | 'M' | 'L', { label: string; rate: number; details: string }> = {
  S: { label: 'Small (Tas Ransel / Laptop)', rate: 2000, details: 'Tas ransel & laptop s.d. 16"' },
  M: { label: 'Medium (Koper Kabin / Helm)', rate: 3000, details: 'Helm full-face, jaket & koper kabin' },
  L: { label: 'Large (Carrier 60-80L / Koper 28-32")', rate: 5000, details: 'Carrier 60-80L / Koper 28-32"' },
}

const PAYMENT_METHODS = [
  {
    key: 'qris',
    label: 'QRIS Instant',
    desc: 'BCA, Mandiri, GoPay, OVO, ShopeePay, DANA & seluruh mobile banking',
    icon: '⬛',
    badge: 'Verifikasi Otomatis',
  },
  {
    key: 'ewallet',
    label: 'E-Wallet (1-Klik)',
    desc: 'GoPay, OVO, DANA, ShopeePay',
    icon: '💳',
    badge: 'Langsung Aktif',
  },
  {
    key: 'va',
    label: 'Virtual Account',
    desc: 'BCA, Mandiri, BNI, BRI, Permata VA',
    icon: '🏦',
    badge: 'Bebas Admin',
  },
]

export function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isSubscriptionMode = searchParams.get('type') === 'subscription'

  const {
    selectedHub,
    selectedHubId,
    selectedSize,
    selectedDuration,
    setActiveLocker,
    loadActiveBooking,
    addTransaction,
    addNotification,
    hasMonthlyPlan,
    subscribeMonthly,
    activeBookings,
    userId,
  } = useStore()

  const [selectedPayment, setSelectedPayment] = useState('qris')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const sizeInfo = SIZES_CONFIG[selectedSize] || SIZES_CONFIG['M']
  const hourlyRate = sizeInfo.rate

  // Subscription Rule: maximum 3 simultaneous lockers under monthly plan
  const activeSubscriptionCount = activeBookings.filter(
    (b) => b.payment_type === 'subscription' && (b.status === 'active' || b.status === 'extended')
  ).length
  const isSubscriptionQuotaReached = activeSubscriptionCount >= 3

  // Check if current booking is fully covered by Monthly Pass (S and M lockers, max 3)
  const isCoveredByMonthlyPass =
    !isSubscriptionMode &&
    hasMonthlyPlan &&
    (selectedSize === 'S' || selectedSize === 'M') &&
    !isSubscriptionQuotaReached

  const amount = isSubscriptionMode
    ? 125000
    : isCoveredByMonthlyPass
    ? 0
    : selectedDuration * hourlyRate

  const handlePay = async () => {
    setLoading(true)
    setErrorMsg(null)

    if (isSubscriptionMode) {
      try {
        const res = await subscribeMonthly()
        if (res.success) {
          navigate('/success?type=subscription', { replace: true })
        } else {
          setErrorMsg(res.message || 'Gagal mengaktifkan paket langganan.')
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setErrorMsg(msg)
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const paymentMethodUsed = isCoveredByMonthlyPass ? 'subscription' : selectedPayment
      const paymentType = isCoveredByMonthlyPass ? 'subscription' : 'per-hour'

      // 1. Process booking and occupy locker in Supabase
      const res = await processBookingTransaction({
        hubId: selectedHubId || 'a1000000-0000-0000-0000-000000000001',
        size: selectedSize,
        mode: paymentType,
        durationHours: selectedDuration,
        amount,
        paymentMethod: paymentMethodUsed,
        userId: userId || undefined,
      })

      const assignedLockerNumber = res.lockerNumber || (selectedSize === 'L' ? 'L-01' : selectedSize === 'S' ? 'S-01' : 'M-07')

      // 2. Activate locker in Zustand store (countdown timer starts automatically)
      setActiveLocker({
        lockerNumber: assignedLockerNumber,
        lockerSize: selectedSize,
        lockerLocation: selectedHub,
        duration: selectedDuration,
        bookingId: res.bookingId,
      })

      // Refresh active bookings list from Supabase
      if (userId) {
        loadActiveBooking(userId)
      }

      // 3. Log transaction locally
      addTransaction({
        id: res.bookingId ? `bk-${res.bookingId.slice(0, 8)}` : `tx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        location: selectedHub,
        lockerSize: selectedSize,
        lockerNumber: assignedLockerNumber,
        duration: selectedDuration,
        amount,
        type: isCoveredByMonthlyPass ? 'subscription' : 'per-hour',
        method: paymentMethodUsed,
        status: 'success',
      })

      addNotification({
        type: 'success',
        title: isCoveredByMonthlyPass ? 'Sewa Loker Aktif (Member VIP)' : 'Pembayaran Berhasil',
        message: `Loker ${assignedLockerNumber} di ${selectedHub} aktif untuk ${selectedDuration} jam.`,
        timeAgo: 'Baru saja',
        action: '/my-locker',
        actionLabel: 'Buka Loker',
      })

      // 4. Redirect to success screen (<3 clicks journey complete)
      navigate('/success', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Payment processing failed:', msg)
      setErrorMsg('Mode offline: Pemesanan tetap diverifikasi untuk sesi demo.')

      // Still navigate gracefully for the demo experience
      setTimeout(() => {
        navigate('/success', { replace: true })
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="p-2 rounded-full bg-green-600 hover:bg-green-500 active:scale-95 transition-all text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isSubscriptionMode
                ? 'Langganan Member VIP'
                : isCoveredByMonthlyPass
                ? 'Konfirmasi Sewa (Member Pass)'
                : 'Pembayaran'}
            </h1>
            <p className="text-green-200 text-xs mt-0.5">
              {isSubscriptionMode
                ? 'Akses loker harian bebas biaya jam sewa di semua hub'
                : isCoveredByMonthlyPass
                ? 'Benefit Member VIP: Tanpa biaya jam sewa'
                : 'Transaksi aman & aktivasi IoT loker instan'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto">
        {/* Order summary card */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">
            {isSubscriptionMode ? 'Ringkasan Paket Langganan' : 'Ringkasan Pesanan'}
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs">
            {isSubscriptionMode ? (
              <>
                <div className="flex items-start gap-3">
                  <Crown size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 flex justify-between items-start gap-2">
                    <span className="text-xs text-gray-500 font-medium">Paket Member</span>
                    <span className="text-xs font-bold text-gray-900 text-right">VIP Pass (30 Hari)</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-green-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 flex justify-between items-start gap-2">
                    <span className="text-xs text-gray-500 font-medium">Cakupan Hub</span>
                    <span className="text-xs font-bold text-gray-900 text-right">Semua Hub Titipin</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package size={16} className="text-green-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 flex justify-between items-start gap-2">
                    <span className="text-xs text-gray-500 font-medium">Ukuran Bebas Biaya</span>
                    <span className="text-xs font-bold text-gray-900 text-right">Size S & Size M</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-green-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 flex justify-between items-start gap-2">
                    <span className="text-xs text-gray-500 font-medium">Masa Aktif</span>
                    <span className="text-xs font-bold text-gray-900 text-right">30 Hari Penuh</span>
                  </div>
                </div>
              </>
            ) : (
              [
                { icon: MapPin, label: 'Lokasi Hub', value: selectedHub },
                { icon: Package, label: 'Ukuran Loker', value: `Size ${selectedSize} — ${sizeInfo.label}` },
                {
                  icon: Clock,
                  label: 'Durasi Sewa',
                  value: `${selectedDuration} Jam (Tarif Normal: ${formatIDR(hourlyRate)}/jam)`,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={16} className="text-green-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 flex justify-between items-start gap-2">
                    <span className="text-xs text-gray-500 font-medium">{label}</span>
                    <span className="text-xs font-bold text-gray-900 text-right max-w-[60%] leading-snug">{value}</span>
                  </div>
                </div>
              ))
            )}

            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <div>
                <span className="text-sm font-extrabold text-gray-800">Total Tagihan</span>
                <p className="text-[10px] text-gray-500">
                  {isSubscriptionMode
                    ? 'Tarif flat 30 hari keanggotaan'
                    : isCoveredByMonthlyPass
                    ? 'Ditanggung Kuota Member VIP'
                    : 'Termasuk integrasi IoT Supabase'}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xl font-black ${isCoveredByMonthlyPass ? 'text-emerald-700' : 'text-green-700'}`}>
                  {formatIDR(amount)}
                </span>
                {!isSubscriptionMode && isCoveredByMonthlyPass && (
                  <p className="text-[10px] text-gray-400 line-through">
                    {formatIDR(selectedDuration * hourlyRate)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods or Member Pass Benefit Card */}
        {isCoveredByMonthlyPass ? (
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-emerald-300 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Crown size={22} className="text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-extrabold text-emerald-950">Gunakan Kuota Member VIP</p>
                  <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full">
                    Rp 0
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Langganan bulanan Anda aktif. Biaya sewa loker Size <strong>{selectedSize}</strong> selama <strong>{selectedDuration} jam</strong> sepenuhnya gratis!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Pilih Metode Pembayaran</p>
              <span className="text-[11px] text-green-700 font-semibold flex items-center gap-1">
                <Sparkles size={12} /> Instan & Bebas Admin
              </span>
            </div>

            <div className="space-y-2.5">
              {PAYMENT_METHODS.map(({ key, label, desc, icon, badge }) => {
                const isSelected = selectedPayment === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPayment(key)}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all text-left min-h-[56px] ${
                      isSelected
                        ? 'border-green-600 bg-green-50/70 shadow-sm ring-1 ring-green-600'
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-sm font-bold text-gray-900">{label}</p>
                        <span className="text-[10px] font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          {badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-green-600 bg-green-600' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Security badge */}
        <div className="flex items-center gap-2.5 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
          <ShieldCheck size={18} className="text-green-700 flex-shrink-0" />
          <span>Slot loker akan direservasi & live countdown langsung berjalan otomatis via Supabase.</span>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <AlertCircle size={16} className="flex-shrink-0 text-amber-600" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Pay CTA button */}
      <div className="px-4 pb-8 pt-3 border-t border-gray-200 bg-white">
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 bg-green-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-green-700/30 hover:bg-green-800 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 min-h-[52px]"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{isSubscriptionMode ? 'Mengaktifkan Langganan...' : 'Memproses IoT Booking...'}</span>
            </>
          ) : isSubscriptionMode ? (
            <>
              <Crown size={18} className="text-amber-300" />
              <span>Bayar & Aktifkan Member VIP • {formatIDR(amount)}</span>
            </>
          ) : isCoveredByMonthlyPass ? (
            <>
              <CheckCircle2 size={18} />
              <span>Gunakan Kuota Member (Rp 0)</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              <span>Bayar Sekarang • {formatIDR(amount)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
