import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Minus, Plus, ShieldCheck, Clock } from 'lucide-react'
import { useStore } from '../store/useStore'

const SIZE_OPTIONS = [
  { key: 'S', label: 'Small bag', desc: 'Fits a small backpack or purse', emoji: '👜' },
  { key: 'M', label: 'Laptop bag', desc: 'Fits a laptop bag or medium bag', emoji: '💼' },
  { key: 'L', label: 'Fits carrier', desc: 'Fits a large travel bag or carrier', emoji: '🧳' },
] as const

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

export function HubDetail() {
  const navigate = useNavigate()
  const {
    selectedHub,
    selectedSize, setSelectedSize,
    selectedMode, setSelectedMode,
    selectedDuration, setSelectedDuration,
  } = useStore()

  const hourlyRate = 3000
  const monthlyRate = 125000
  const total = selectedMode === 'per-hour' ? selectedDuration * hourlyRate : monthlyRate

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Hub Detail</h1>
            <p className="text-green-200 text-xs flex items-center gap-1 mt-0.5">
              <MapPin size={11} />
              {selectedHub}
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-green-800 p-1 rounded-xl mt-1">
          {(['per-hour', 'subscription'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedMode === mode
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-green-200 hover:text-white'
              }`}
            >
              {mode === 'per-hour' ? 'Per hour' : 'Subscription'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto">
        {/* Size selector */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Select locker size</p>
          <div className="space-y-2">
            {SIZE_OPTIONS.map(({ key, label, desc, emoji }) => {
              const isDisabled = selectedMode === 'subscription' && key === 'L'
              return (
                <button
                  key={key}
                  disabled={isDisabled}
                  onClick={() => setSelectedSize(key)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                    selectedSize === key && !isDisabled
                      ? 'border-green-600 bg-green-50'
                      : isDisabled
                      ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{key}</span>
                      <span className="text-sm font-medium text-gray-600">{label}</span>
                      {isDisabled && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                          Per hour only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedSize === key && !isDisabled ? 'border-green-600 bg-green-600' : 'border-gray-300'
                  }`}>
                    {selectedSize === key && !isDisabled && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration / Plan info */}
        {selectedMode === 'per-hour' ? (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Duration</p>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
              <button
                onClick={() => setSelectedDuration(Math.max(1, selectedDuration - 1))}
                className="w-10 h-10 rounded-xl bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
              >
                <Minus size={16} className="text-gray-600" />
              </button>
              <div className="text-center">
                <span className="text-3xl font-bold text-gray-800">{selectedDuration}</span>
                <span className="text-sm text-gray-500 ml-1">hr{selectedDuration > 1 ? 's' : ''}</span>
                <p className="text-xs text-gray-400 mt-0.5">× {formatIDR(hourlyRate)}/hour</p>
              </div>
              <button
                onClick={() => setSelectedDuration(Math.min(24, selectedDuration + 1))}
                className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center hover:bg-green-800 active:scale-95 transition-all shadow-sm"
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center flex-shrink-0">
                <Package size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-green-800">Monthly Plan</p>
                <p className="text-xs text-green-700 mt-1 leading-relaxed">
                  Unlimited hours every day at all hubs. Covers S and M lockers. L billed per hour.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No-fine reminder */}
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <ShieldCheck size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>No fine policy:</strong> You'll receive a reminder 10 minutes before time is up. Extend anytime without penalty.
          </p>
        </div>

        {selectedMode === 'per-hour' && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <Clock size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Countdown begins immediately after payment confirmation.
            </p>
          </div>
        )}
      </div>

      {/* Total & CTA */}
      <div className="px-4 pb-8 pt-3 border-t border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400">Total price</p>
            <p className="text-2xl font-bold text-gray-900">{formatIDR(total)}</p>
          </div>
          {selectedMode === 'per-hour' && (
            <p className="text-xs text-gray-500">
              {selectedDuration} hr{selectedDuration > 1 ? 's' : ''} × {formatIDR(hourlyRate)}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/payment')}
          className="w-full py-4 bg-green-700 text-white rounded-2xl font-semibold text-base shadow-lg shadow-green-700/30 hover:bg-green-800 active:scale-95 transition-all"
        >
          Continue to payment
        </button>
      </div>
    </div>
  )
}
