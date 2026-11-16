import { useState } from 'react'
import { Receipt, CalendarDays } from 'lucide-react'
import { useStore } from '../store/useStore'

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'per-hour', label: 'Per hour' },
  { key: 'subscription', label: 'Subscription' },
] as const

export function Transactions() {
  const { transactions } = useStore()
  const [filter, setFilter] = useState<'all' | 'per-hour' | 'subscription'>('all')

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <h1 className="text-white text-2xl font-bold mb-4">Transactions</h1>
        <div className="flex gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                filter === key ? 'bg-white text-green-700' : 'bg-green-600 text-green-100 hover:bg-green-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Receipt size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx) => (
              <div key={tx.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'subscription' ? 'bg-purple-100' : 'bg-green-100'
                    }`}>
                      {tx.type === 'subscription' ? (
                        <CalendarDays size={18} className="text-purple-600" />
                      ) : (
                        <Receipt size={18} className="text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {tx.type === 'subscription' ? 'Monthly Plan' : `Locker ${tx.lockerNumber}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{tx.location}</p>
                      <p className="text-xs text-gray-400">
                        {tx.date}
                        {tx.duration ? ` • ${tx.duration} hr${tx.duration > 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatIDR(tx.amount)}</p>
                    <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      tx.status === 'plan'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {tx.status === 'plan' ? 'Plan' : 'Success'}
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
