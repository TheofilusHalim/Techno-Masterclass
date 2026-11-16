import { useState } from 'react'
import { ChevronDown, ChevronUp, Cpu, Lock, Unlock, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'

export function SimulatorPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const { lockerStatus, lockerStatusLog, lockerNumber, triggerUnlock } = useStore()

  const statusColors = {
    idle: 'bg-gray-100 text-gray-500',
    locked: 'bg-red-100 text-red-600',
    unlocked: 'bg-green-100 text-green-700',
  }

  const doorAngle = lockerStatus === 'unlocked' ? '-rotate-45' : 'rotate-0'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-green-700 text-white"
      >
        <div className="flex items-center gap-2">
          <Cpu size={18} />
          <span className="font-semibold text-sm">Hardware Locker Simulator</span>
        </div>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Locker number */}
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Active Locker</p>
            <p className="text-2xl font-bold text-gray-800">{lockerNumber}</p>
          </div>

          {/* Animated door SVG */}
          <div className="flex justify-center">
            <div className="relative w-32 h-40 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center overflow-hidden">
              {/* Door frame */}
              <div className="absolute inset-0 flex items-end justify-start">
                {/* Door panel */}
                <div
                  className={`absolute inset-0 bg-gray-400 rounded-lg border border-gray-500 transition-all duration-700 origin-left ${doorAngle}`}
                  style={{ transformOrigin: 'left center' }}
                >
                  {/* Handle */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-6 bg-gray-600 rounded-full" />
                </div>
              </div>
              {/* Interior when open */}
              {lockerStatus === 'unlocked' && (
                <div className="absolute inset-0 bg-green-50 flex items-center justify-center">
                  <div className="text-center">
                    <Unlock className="text-green-600 mx-auto" size={28} />
                    <p className="text-[10px] text-green-700 font-semibold mt-1">OPEN</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="flex justify-center">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1 ${statusColors[lockerStatus]}`}>
              {lockerStatus === 'unlocked' ? <Unlock size={12} /> : <Lock size={12} />}
              {lockerStatus}
            </span>
          </div>

          {/* Manual trigger */}
          <button
            onClick={() => triggerUnlock('Simulator Panel')}
            disabled={lockerStatus === 'unlocked'}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-800 transition-colors"
          >
            <Zap size={15} />
            Simulate Open
          </button>

          {/* Event log */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Event Log</p>
            <div className="bg-gray-900 rounded-lg p-2 max-h-32 overflow-y-auto scrollbar-hide">
              {lockerStatusLog.map((entry, i) => (
                <p key={i} className="text-[10px] text-green-400 font-mono leading-4">{entry}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
