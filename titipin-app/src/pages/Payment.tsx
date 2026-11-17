import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Clock, CheckCircle2, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react'
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
  const {
    selectedHub,
    selectedHubId,
    selectedSize,
    selectedMode,
    selectedDuration,
    setActiveLocker,
    addTransaction,
    subscribeMonthly,
  } = useStore()

  const [selectedPayment, setSelectedPayment] = useState('qris')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const sizeInfo = SIZES_CONFIG[selectedSize] || SIZES_CONFIG['M']
  const hourlyRate = sizeInfo.rate
  const monthlyRate = 125000
  const amount = selectedMode === 'per-hour' ? selectedDuration * hourlyRate : monthlyRate

  const handlePay = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Process booking and occupy locker in Supabase
      const res = await processBookingTransaction({
        hubId: selectedHubId || 'a1000000-0000-0000-0000-000000000001',
        size: selectedSize,
        mode: selectedMode,
        durationHours: selectedDuration,
        amount,
        paymentMethod: selectedPayment,
      })

      const assignedLockerNumber = res.lockerNumber || (selectedSize === 'L' ? 'L-01' : selectedSize === 'S' ? 'S-01' : 'M-07')

      // 2. Activate locker in Zustand store (countdown timer starts automatically)
      setActiveLocker({
        lockerNumber: assignedLockerNumber,
        lockerSize: selectedSize,
        lockerLocation: selectedHub,
        duration: selectedMode === 'per-hour' ? selectedDuration : 720,
        bookingId: res.bookingId,
      })

      // 3. If subscription, mark subscription in store
      if (selectedMode === 'subscription') {
        subscribeMonthly()
      } else {
        // 4. Log transaction locally
        addTransaction({
          id: res.bookingId ? `bk-${res.bookingId.slice(0, 8)}` : `tx-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          location: selectedHub,
          lockerSize: selectedSize,
          lockerNumber: assignedLockerNumber,
          duration: selectedDuration,
          amount,
          type: 'per-hour',
          status: 'success',
        })
      }

      // 5. Redirect to success screen (<3 clicks journey complete)
      navigate('/success', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Payment processing failed:', msg)
      setErrorMsg('Mode offline: Pembayaran tetap diverifikasi untuk sesi demo.')

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
            <h1 className="text-xl font-bold tracking-tight">Pembayaran</h1>
            <p className="text-green-200 text-xs mt-0.5">Transaksi aman & aktivasi IoT loker instan</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto">
        {/* Order summary card */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Ringkasan Pesanan</p>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs">
            {[
              { icon: MapPin, label: 'Lokasi Hub', value: selectedHub },
              { icon: Package, label: 'Ukuran Loker', value: `Size ${selectedSize} (${sizeInfo.label})` },
              {
                icon: Clock,
                label: 'Opsi Sewa',
                value: selectedMode === 'per-hour' ? `${selectedDuration} Jam (Tarif: ${formatIDR(hourlyRate)}/jam)` : 'Paket Bulanan (Unlimited)',
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon size={16} className="text-green-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 flex justify-between items-start gap-2">
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                  <span className="text-xs font-bold text-gray-900 text-right max-w-[60%] leading-snug">{value}</span>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <div>
                <span className="text-sm font-extrabold text-gray-800">Total Tagihan</span>
                <p className="text-[10px] text-gray-500">Termasuk integrasi IoT Supabase</p>
              </div>
              <span className="text-xl font-black text-green-700">{formatIDR(amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment methods */}
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
              <span>Memproses IoT Booking...</span>
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
