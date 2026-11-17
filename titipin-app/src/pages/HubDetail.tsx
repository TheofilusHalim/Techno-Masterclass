import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Minus, Plus, ShieldCheck, Clock, Check, AlertCircle, Crown, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

export interface SizeOption {
  key: 'S' | 'M' | 'L'
  subtitle: string
  desc: string
  rate: number
  emoji: string
  dimensions: string
  idealFor: string
}

const SIZE_OPTIONS: SizeOption[] = [
  {
    key: 'S',
    subtitle: 'Tas Ransel / Laptop s.d. 16"',
    desc: 'Backpack 15-20L, buku kuliah, helm half-face, barang bawaan harian',
    rate: 2000,
    emoji: '🎒',
    dimensions: '30 × 40 × 45 cm',
    idealFor: 'Mahasiswa & Komuter harian',
  },
  {
    key: 'M',
    subtitle: 'Helm Full-Face, Jaket & Koper Kabin',
    desc: 'Koper kabin 20 inch, helm full-face, tas belanja, atau ransel besar',
    rate: 3000,
    emoji: '💼',
    dimensions: '45 × 50 × 55 cm',
    idealFor: 'Short trip & helm motor',
  },
  {
    key: 'L',
    subtitle: 'Carrier 60-80L / Koper 28-32"',
    desc: 'Muat carrier ransel gunung 60-80L atau koper bagasi besar. Pas untuk Melina & Traveller!',
    rate: 5000,
    emoji: '🧳',
    dimensions: '60 × 75 × 65 cm',
    idealFor: 'Traveller, turis & carrier besar',
  },
]

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

export function HubDetail() {
  const navigate = useNavigate()
  const {
    selectedHub,
    selectedHubId,
    selectedSize, setSelectedSize,
    selectedDuration, setSelectedDuration,
    hasMonthlyPlan,
    activeBookings,
  } = useStore()

  // Live locker availability slots state
  const [availableSlots, setAvailableSlots] = useState<Record<'S' | 'M' | 'L', number>>({ S: 2, M: 2, L: 1 })
  const [loadingSlots, setLoadingSlots] = useState(true)

  // Fetch real-time locker counts for selected hub
  useEffect(() => {
    let isMounted = true

    async function loadLockerAvailability() {
      try {
        const hubIdToQuery = selectedHubId || 'a1000000-0000-0000-0000-000000000001'
        const { data, error } = await supabase
          .from('lockers')
          .select('size, status')
          .eq('hub_id', hubIdToQuery)

        if (!error && data && data.length > 0) {
          const available = data.filter((l: any) => l.status === 'available')
          const counts: Record<'S' | 'M' | 'L', number> = {
            S: available.filter((l: any) => l.size === 'S').length,
            M: available.filter((l: any) => l.size === 'M').length,
            L: available.filter((l: any) => l.size === 'L').length,
          }

          if (isMounted) {
            setAvailableSlots(counts)

            // Auto-switch size if currently selected size has 0 free slots
            if (counts[selectedSize] === 0) {
              const alternative = (['S', 'M', 'L'] as const).find((s) => counts[s] > 0)
              if (alternative) {
                setSelectedSize(alternative)
              }
            }
          }
        }
      } catch (err) {
        console.warn('Locker availability fetch error:', err)
      } finally {
        if (isMounted) setLoadingSlots(false)
      }
    }

    loadLockerAvailability()

    // Realtime postgres changes
    const channel = supabase
      .channel(`hub-lockers:${selectedHubId || 'default'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lockers' }, () => {
        loadLockerAvailability()
      })
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [selectedHubId, selectedSize, setSelectedSize])

  const selectedOption = SIZE_OPTIONS.find((s) => s.key === selectedSize) || SIZE_OPTIONS[1]
  const baseHourlyRate = selectedOption.rate

  // Subscription Rule: maximum 3 simultaneous lockers under monthly plan
  const activeSubscriptionCount = activeBookings.filter(
    (b) => b.payment_type === 'subscription' && (b.status === 'active' || b.status === 'extended')
  ).length
  const isSubscriptionQuotaReached = activeSubscriptionCount >= 3

  // Monthly Pass Benefit Check: covers S and M lockers IF active subscription count < 3. Size L is billed per hour.
  const isCoveredByMonthlyPass =
    hasMonthlyPlan && (selectedSize === 'S' || selectedSize === 'M') && !isSubscriptionQuotaReached
  const total = isCoveredByMonthlyPass ? 0 : selectedDuration * baseHourlyRate

  // Check validity of selection
  const isSelectedSizeOutOfStock = availableSlots[selectedSize] === 0
  const isCtaDisabled = isSelectedSizeOutOfStock

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="p-2 rounded-full bg-green-600 hover:bg-green-500 active:scale-95 transition-all text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight">Pilih Loker di Hub</h1>
            <p className="text-green-200 text-xs flex items-center gap-1 mt-0.5 truncate">
              <MapPin size={12} className="flex-shrink-0" />
              <span>{selectedHub}</span>
            </p>
          </div>
        </div>

        {/* Member status banner if active */}
        {hasMonthlyPlan && (
          <div className="mt-3 bg-green-800/90 border border-green-500/50 rounded-xl px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown size={15} className="text-amber-300" />
              <span className="text-xs font-bold text-white">Member VIP Aktif</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isSubscriptionQuotaReached ? 'bg-amber-500 text-amber-950' : 'bg-amber-400 text-amber-950'
            }`}>
              {isSubscriptionQuotaReached
                ? 'Batas Langganan Tercapai (3/3 Aktif)'
                : `Size S & M Bebas Biaya (${activeSubscriptionCount}/3)`}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto">
        {/* Size Selector Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
              Pilih Ukuran Loker
            </p>
            {loadingSlots ? (
              <span className="text-[11px] text-gray-400 animate-pulse">Cek ketersediaan...</span>
            ) : (
              <span className="text-[11px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-md">
                Live Supabase Slots
              </span>
            )}
          </div>

          <div className="space-y-3">
            {SIZE_OPTIONS.map(({ key, subtitle, desc, rate, emoji, dimensions, idealFor }) => {
              const freeCount = availableSlots[key] ?? 0
              const isOutOfStock = freeCount === 0
              const isSelected = selectedSize === key && !isOutOfStock
              const isSizeCovered = hasMonthlyPlan && (key === 'S' || key === 'M') && !isSubscriptionQuotaReached

              return (
                <button
                  key={key}
                  disabled={isOutOfStock}
                  onClick={() => setSelectedSize(key)}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all relative ${
                    isSelected
                      ? 'border-green-600 bg-green-50/70 shadow-sm ring-1 ring-green-600'
                      : isOutOfStock
                      ? 'border-gray-200 bg-gray-50/70 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl flex-shrink-0 mt-0.5">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-base font-extrabold ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                            Size {key}
                          </span>
                          <span className="text-xs font-semibold text-gray-700">
                            {subtitle}
                          </span>
                        </div>

                        {/* Availability Status Pill */}
                        {isOutOfStock ? (
                          <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                            0 Free (Penuh)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                            {freeCount} Tersedia
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 leading-snug mb-1.5">{desc}</p>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                        <span className="text-gray-500 font-mono">
                          📐 {dimensions}
                        </span>
                        {isSizeCovered ? (
                          <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles size={11} /> Gratis (Benefit Member)
                          </span>
                        ) : (
                          <span className="font-bold text-green-700">
                            {formatIDR(rate)}/jam
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-gray-400 mt-0.5">
                        💡 Cocok untuk: {idealFor}
                      </p>
                    </div>

                    {/* Radio check icon */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${
                        isSelected
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration Selection Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
              Durasi Pemakaian Loker
            </p>
            {isCoveredByMonthlyPass && (
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                Bebas biaya jam
              </span>
            )}
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <button
              onClick={() => setSelectedDuration(Math.max(1, selectedDuration - 1))}
              className="w-11 h-11 rounded-xl bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shadow-xs"
              aria-label="Kurangi durasi"
            >
              <Minus size={18} className="text-gray-700" />
            </button>
            <div className="text-center">
              <div className="flex items-baseline justify-center">
                <span className="text-3xl font-extrabold text-gray-900">{selectedDuration}</span>
                <span className="text-sm font-semibold text-gray-600 ml-1">Jam</span>
              </div>
              {isCoveredByMonthlyPass ? (
                <p className="text-xs text-emerald-700 font-bold mt-0.5">
                  Termasuk Kuota Member (Rp 0)
                </p>
              ) : (
                <p className="text-xs text-green-700 font-medium mt-0.5">
                  Tarif Size {selectedSize}: {formatIDR(baseHourlyRate)}/jam
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedDuration(Math.min(24, selectedDuration + 1))}
              className="w-11 h-11 rounded-xl bg-green-700 flex items-center justify-center hover:bg-green-800 active:scale-95 transition-all shadow-xs text-white"
              aria-label="Tambah durasi"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Feature Badges: No Fine Policy & Instant Timer */}
        <div className="space-y-2">
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <ShieldCheck size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong>Anti-Denda (No Fine Policy):</strong> Anda akan menerima pengingat 10 menit sebelum waktu sewa habis. Perpanjang instan kapan saja (+1 Jam) lewat aplikasi tanpa pinalti!
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Clock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              Hitungan mundur live timer akan otomatis aktif seketika loker berhasil direservasi.
            </div>
          </div>
        </div>

        {/* Warning if selected size is out of stock */}
        {isSelectedSizeOutOfStock && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
            <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
            <span>
              Loker <strong>Size {selectedSize}</strong> saat ini sedang penuh di hub ini. Silakan pilih ukuran lain yang tersedia di atas.
            </span>
          </div>
        )}
      </div>

      {/* Footer Total & CTA */}
      <div className="px-4 pb-8 pt-3 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Pembayaran</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-gray-900">{formatIDR(total)}</p>
              {isCoveredByMonthlyPass && (
                <span className="text-xs text-gray-400 line-through">
                  {formatIDR(selectedDuration * baseHourlyRate)}
                </span>
              )}
            </div>
          </div>
          {isCoveredByMonthlyPass ? (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
              <Crown size={12} className="text-amber-500" /> Benefit Member VIP
            </span>
          ) : (
            <p className="text-xs text-gray-600 font-medium text-right">
              {selectedDuration} jam × {formatIDR(baseHourlyRate)}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/payment')}
          disabled={isCtaDisabled}
          className="w-full py-4 bg-green-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-green-700/30 hover:bg-green-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]"
        >
          {isSelectedSizeOutOfStock
            ? `Size ${selectedSize} Penuh - Pilih Ukuran Lain`
            : isCoveredByMonthlyPass
            ? 'Gunakan Kuota Member (Rp 0)'
            : 'Lanjut ke Pembayaran'}
        </button>
      </div>
    </div>
  )
}
