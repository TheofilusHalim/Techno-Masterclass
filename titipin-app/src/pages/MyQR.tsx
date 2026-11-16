import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatTime } from '../utils/time'

function QRCodeSVG({ value }: { value: string }) {
  // Generate a deterministic pattern based on value string
  const size = 200
  const cells = 20
  const cellSize = size / cells
  const seed = value.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const grid: boolean[][] = []
  for (let r = 0; r < cells; r++) {
    grid[r] = []
    for (let c = 0; c < cells; c++) {
      // Simple deterministic pattern + finder patterns
      const isFinderTL = (r < 7 && c < 7)
      const isFinderTR = (r < 7 && c >= cells - 7)
      const isFinderBL = (r >= cells - 7 && c < 7)
      const isData = (seed * (r + 1) * (c + 1) + r * c) % 7 < 3
      grid[r][c] = isFinderTL || isFinderTR || isFinderBL || isData
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" rx="8" />
      {grid.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize + 1}
              y={r * cellSize + 1}
              width={cellSize - 1}
              height={cellSize - 1}
              fill="#166534"
              rx="1"
            />
          ) : null
        )
      )}
      {/* Finder pattern borders */}
      <rect x="2" y="2" width="6" height="6" fill="none" stroke="#166534" strokeWidth="1.5" rx="1" />
      <rect x={size - 44} y="2" width="6" height="6" fill="none" stroke="#166534" strokeWidth="1.5" rx="1" />
      <rect x="2" y={size - 44} width="6" height="6" fill="none" stroke="#166534" strokeWidth="1.5" rx="1" />
    </svg>
  )
}

export function MyQR() {
  const navigate = useNavigate()
  const { lockerNumber, lockerSize, lockerLocation, remainingSeconds, qrRefreshSeconds, tickQRTimer, tickLockerTimer, triggerUnlock } = useStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickQRTimer()
      tickLockerTimer()
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tickQRTimer, tickLockerTimer])

  const pin = '482 913'
  const qrValue = `titipin-locker-${lockerNumber}-${qrRefreshSeconds}`
  const refreshPercent = ((60 - qrRefreshSeconds) / 60) * 100

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">My QR Code</h1>
            <p className="text-green-200 text-xs mt-0.5">Locker {lockerNumber} • {lockerLocation}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 space-y-5">
        {/* QR Card */}
        <div className="w-full bg-white border border-gray-200 rounded-3xl p-6 shadow-md flex flex-col items-center">
          <div className="mb-4 p-3 border-2 border-dashed border-green-200 rounded-2xl bg-green-50">
            <QRCodeSVG value={qrValue} />
          </div>

          {/* Refresh countdown ring */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="16" cy="16" r="12" fill="none" stroke="#15803d" strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 12}`}
                  strokeDashoffset={`${2 * Math.PI * 12 * refreshPercent / 100}`}
                  strokeLinecap="round"
                />
              </svg>
              <RefreshCw size={12} className="absolute inset-0 m-auto text-green-700" />
            </div>
            <span className="text-sm text-gray-600">
              Code refreshes in <strong className="text-green-700">00:{String(qrRefreshSeconds).padStart(2, '0')}</strong>
            </span>
          </div>

          {/* PIN */}
          <div className="w-full bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Or enter 6-digit PIN</p>
            <p className="text-4xl font-bold tracking-[0.3em] text-gray-800 font-mono">{pin}</p>
          </div>
        </div>

        {/* Locker info card */}
        <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-green-600 font-medium">Active Locker</p>
              <p className="text-lg font-bold text-gray-800">Locker {lockerNumber}</p>
              <p className="text-xs text-gray-500">Size {lockerSize} • {lockerLocation}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Time remaining</p>
              <p className="text-xl font-bold text-green-700 font-mono">{formatTime(remainingSeconds)}</p>
            </div>
          </div>
          <button
            onClick={() => triggerUnlock('Test open (QR screen)')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-700 text-white rounded-xl font-semibold text-sm hover:bg-green-800 active:scale-95 transition-all shadow-sm"
          >
            <Zap size={16} />
            Test open
          </button>
        </div>
      </div>
    </div>
  )
}
