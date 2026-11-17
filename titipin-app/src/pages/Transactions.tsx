import { useState } from 'react'
import { Receipt, CalendarDays, MapPin, CreditCard, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

const FILTERS = [
  { key: 'all', label: 'Semua Transaksi' },
  { key: 'per-hour', label: 'Sewa Per Jam' },
  { key: 'subscription', label: 'Langganan' },
] as const

export function Transactions() {
  const navigate = useNavigate()
  const { transactions } = useStore()
  const [filter, setFilter] = useState<'all' | 'per-hour' | 'subscription'>('all')

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="p-2 rounded-full bg-green-600 hover:bg-green-500 active:scale-95 transition-all text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-black tracking-tight">Riwayat Transaksi</h1>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === key
                  ? 'bg-white text-green-800 shadow-sm'
                  : 'bg-green-800/80 text-green-200 hover:bg-green-600 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <span>Menampilkan {filtered.length} transaksi</span>
          <span className="font-semibold text-green-700">Audit Transaksi Aman</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Receipt size={32} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-700">Belum Ada Transaksi</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Semua transaksi pemesanan dan perpanjangan sewa loker Anda akan tercatat di sini.
            </p>
            <button
              onClick={() => navigate('/nearby-lockers')}
              className="mt-4 px-5 py-2.5 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 active:scale-95 transition-all"
            >
              Pesan Loker Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx) => {
              const isSubscription = tx.type === 'subscription'
              return (
                <div
                  key={tx.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs hover:border-green-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isSubscription ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {isSubscription ? <CalendarDays size={20} /> : <Receipt size={20} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-extrabold text-gray-900">
                            {isSubscription ? 'Paket Langganan 30 Hari' : `Loker ${tx.lockerNumber}`}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                              isSubscription
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            Size {tx.lockerSize}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 flex items-center gap-1 truncate mb-1">
                          <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                          <span>{tx.location}</span>
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          <span>{tx.date}</span>
                          {tx.duration && (
                            <>
                              <span>•</span>
                              <span>{tx.duration} Jam</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1 text-gray-500 font-medium">
                            <CreditCard size={11} /> QRIS / VA
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-gray-900">{formatIDR(tx.amount)}</p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          tx.status === 'plan'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {tx.status === 'plan' ? 'Aktif' : 'Berhasil'}
                      </span>
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
