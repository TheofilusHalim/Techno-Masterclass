import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Unlock, Package, Clock, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatTime } from '../utils/time'

export function MyLocker() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active')
  const { hasActiveLocker, lockerNumber, lockerSize, lockerLocation, remainingSeconds, tickLockerTimer, extendLocker, triggerUnlock } = useStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => tickLockerTimer(), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tickLockerTimer])

  const isAlmostUp = remainingSeconds < 600

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <h1 className="text-white text-2xl font-bold mb-4">My Locker</h1>
        {/* Tabs */}
        <div className="flex gap-2">
          {(['active', 'finished'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all capitalize ${
                activeTab === tab ? 'bg-white text-green-700' : 'bg-green-600 text-green-100 hover:bg-green-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-5">
        {activeTab === 'active' ? (
          hasActiveLocker ? (
            <div className="space-y-4">
              {/* Almost up warning */}
              {isAlmostUp && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
                  <Clock size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700">
                    <strong>Time is almost up!</strong> Locker {lockerNumber} closes in{' '}
                    {Math.ceil(remainingSeconds / 60)} minutes. Extend now to avoid a fine.
                  </p>
                </div>
              )}

              {/* Active locker card */}
              <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-3xl p-5 text-white shadow-xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-green-300 text-xs font-medium uppercase tracking-wide">Active Locker</p>
                    <p className="text-3xl font-bold mt-0.5">Locker {lockerNumber}</p>
                    <p className="text-green-200 text-sm mt-1">Size {lockerSize} • {lockerLocation}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center">
                    <Package size={24} className="text-white" />
                  </div>
                </div>

                {/* Timer */}
                <div className="text-center mb-6">
                  <p className="text-green-300 text-xs uppercase tracking-wide mb-1">Time remaining</p>
                  <p className={`text-5xl font-bold font-mono tracking-tight ${isAlmostUp ? 'text-orange-300 animate-pulse' : 'text-white'}`}>
                    {formatTime(remainingSeconds)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={extendLocker}
                    className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 active:scale-95 rounded-xl font-semibold text-sm transition-all"
                  >
                    <Plus size={16} />
                    Extend +1 hr
                  </button>
                  <button
                    onClick={() => triggerUnlock('Open locker button')}
                    className="flex items-center justify-center gap-2 py-3 bg-white text-green-700 hover:bg-green-50 active:scale-95 rounded-xl font-semibold text-sm transition-all shadow-sm"
                  >
                    <Unlock size={16} />
                    Open locker
                  </button>
                </div>
              </div>

              {/* Quick QR access */}
              <button
                onClick={() => navigate('/my-qr')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 text-base">🔲</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">Show QR & PIN</p>
                    <p className="text-xs text-gray-400">Tap to view your access code</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-medium">View →</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-16">
              <Package size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No active locker</p>
              <button
                onClick={() => navigate('/nearby-lockers')}
                className="mt-4 px-6 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
              >
                Book a locker
              </button>
            </div>
          )
        ) : (
          /* Finished tab */
          <div className="space-y-3">
            {[
              { num: 'S-03', loc: 'Gubeng Station', date: '14 Nov 2026', dur: '1 hr', amt: 'Rp3.000' },
              { num: 'M-04', loc: 'Tunjungan Plaza', date: '10 Nov 2026', dur: '3 hrs', amt: 'Rp9.000' },
              { num: 'L-01', loc: 'Petra Library Hub', date: '5 Nov 2026', dur: '2 hrs', amt: 'Rp6.000' },
            ].map((item) => (
              <div key={item.num} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                      <CheckCircle2 size={18} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Locker {item.num}</p>
                      <p className="text-xs text-gray-400">{item.loc}</p>
                      <p className="text-xs text-gray-400">{item.date} • {item.dur}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{item.amt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
