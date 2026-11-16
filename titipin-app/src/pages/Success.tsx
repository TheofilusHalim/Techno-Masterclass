import { useNavigate } from 'react-router-dom'
import { CheckCircle2, QrCode, Package, Home } from 'lucide-react'
import { useStore } from '../store/useStore'

export function Success() {
  const navigate = useNavigate()
  const { lockerNumber } = useStore()

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 bg-white text-center">
      {/* Success icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={56} className="text-green-600" />
        </div>
        <div className="absolute -right-1 -top-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
          <span className="text-white text-sm">🎉</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Booking Confirmed!</h1>
      <p className="text-lg text-green-700 font-semibold mb-2">Locker {lockerNumber} is yours</p>
      <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-xs">
        Head to the locker and open it using your QR code or 6-digit PIN. Countdown has started!
      </p>

      {/* Instructions */}
      <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-left space-y-3">
        {[
          { step: '1', text: 'Go to your locker at the hub' },
          { step: '2', text: 'Scan your QR code or enter 6-digit PIN' },
          { step: '3', text: 'Door opens — place your items inside' },
          { step: '4', text: 'Extend anytime from the app, no fines!' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-green-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {step}
            </span>
            <p className="text-sm text-gray-600">{text}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="w-full space-y-3">
        <button
          onClick={() => navigate('/my-qr')}
          className="w-full py-3.5 bg-green-700 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-700/30 hover:bg-green-800 transition-colors"
        >
          <QrCode size={18} />
          Show my QR
        </button>
        <button
          onClick={() => navigate('/my-locker')}
          className="w-full py-3.5 bg-green-50 text-green-700 border border-green-200 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
        >
          <Package size={18} />
          View my locker
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3.5 text-gray-500 font-medium text-sm flex items-center justify-center gap-2 hover:text-gray-700 transition-colors"
        >
          <Home size={16} />
          Back to home
        </button>
      </div>
    </div>
  )
}
