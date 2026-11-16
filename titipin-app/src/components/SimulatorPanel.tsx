import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Cpu, Lock, Unlock, Zap, Radio, CreditCard, Monitor } from 'lucide-react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

function LockerTftDisplay({
  lockerCode,
  isOccupied,
  userName,
  qrPayload,
}: {
  lockerCode: string
  isOccupied: boolean
  userName: string
  qrPayload: string
}) {
  // Generate deterministic QR Code pattern for TFT display simulation
  const size = 110
  const cells = 15
  const cellSize = size / cells
  const seed = qrPayload.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const grid: boolean[][] = []
  for (let r = 0; r < cells; r++) {
    grid[r] = []
    for (let c = 0; c < cells; c++) {
      const isFinderTL = r < 5 && c < 5
      const isFinderTR = r < 5 && c >= cells - 5
      const isFinderBL = r >= cells - 5 && c < 5
      const isData = (seed * (r + 2) * (c + 2) + r * c) % 5 < 2
      grid[r][c] = isFinderTL || isFinderTR || isFinderBL || isData
    }
  }

  return (
    <div className="bg-black text-white p-3 rounded-xl border-2 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-mono text-[10px]">
      {/* TFT LCD Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-2">
        <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
          <Monitor size={10} /> TFT LCD 2.4"
        </span>
        <span className="text-[9px] text-gray-400">UK Petra Hub</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-like QR Code rendered on LCD */}
        <div className="bg-white p-1 rounded border border-gray-300 flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect width={size} height={size} fill="white" />
            {grid.map((row, r) =>
              row.map((filled, c) =>
                filled ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c * cellSize + 0.5}
                    y={r * cellSize + 0.5}
                    width={cellSize - 0.5}
                    height={cellSize - 0.5}
                    fill="#111827"
                  />
                ) : null
              )
            )}
            {/* Finder border markers */}
            <rect x="1" y="1" width={cellSize * 4} height={cellSize * 4} fill="none" stroke="#111827" strokeWidth="1.5" />
            <rect x={size - cellSize * 4 - 1} y="1" width={cellSize * 4} height={cellSize * 4} fill="none" stroke="#111827" strokeWidth="1.5" />
            <rect x="1" y={size - cellSize * 4 - 1} width={cellSize * 4} height={cellSize * 4} fill="none" stroke="#111827" strokeWidth="1.5" />
          </svg>
        </div>

        {/* LCD Text Information */}
        <div className="flex-1 space-y-1">
          <div>
            <p className="text-[8px] text-gray-400 uppercase">Unit Loker</p>
            <p className="text-sm font-bold text-emerald-300 font-mono">{lockerCode}</p>
          </div>
          <div>
            <p className="text-[8px] text-gray-400 uppercase">Status</p>
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                isOccupied ? 'bg-amber-900/70 text-amber-300 border border-amber-600/50' : 'bg-emerald-900/70 text-emerald-300 border border-emerald-600/50'
              }`}
            >
              {isOccupied ? '● Terisi' : '○ Kosong'}
            </span>
          </div>
          {isOccupied && (
            <div>
              <p className="text-[8px] text-gray-400 uppercase">Penyewa</p>
              <p className="text-[10px] text-white font-medium truncate">{userName}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 pt-1 border-t border-gray-800 text-[8px] text-gray-400 truncate">
        Payload: <span className="text-emerald-400 font-mono">{qrPayload}</span>
      </div>
    </div>
  )
}

export function SimulatorPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const {
    lockerStatus,
    isDoorOpen,
    lockerStatusLog,
    lockerNumber,
    userName,
    triggerUnlock,
    setDoorOpenFromRealtime,
    connectionStatus,
    connectionError,
  } = useStore()

  // Realtime subscription to lockers table in Supabase
  useEffect(() => {
    const channel = supabase
      .channel('realtime:simulator_panel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lockers' },
        (payload) => {
          const newRow = payload.new as any
          if (!newRow) return

          // If the change applies to current locker or demo locker M-07
          if (newRow.locker_number === lockerNumber || newRow.locker_number === 'M-07') {
            const isCommandUnlock = newRow.door_command === 'UNLOCK'
            const isDoorOpenBool = newRow.is_door_open === true
            const isStatusUnlocked = newRow.status === 'unlocked'

            if (isCommandUnlock || isDoorOpenBool || isStatusUnlocked) {
              setDoorOpenFromRealtime(true, `Supabase Realtime (door_command = UNLOCK)`)
            } else {
              setDoorOpenFromRealtime(false, `Supabase Realtime (door_command = LOCKED)`)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lockerNumber, setDoorOpenFromRealtime])

  // Visual open state
  const isOpen = isDoorOpen || lockerStatus === 'unlocked'
  const qrPayload = `TITIPIN:UK_PETRA:${lockerNumber}`

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-green-700 text-white"
      >
        <div className="flex items-center gap-2">
          <Cpu size={18} />
          <span className="font-semibold text-sm">ESP32-S3 Hardware Locker</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] bg-green-800 text-green-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            IoT Live
          </span>
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Supabase Realtime indicator */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
            <div className="flex items-center gap-1.5">
              <Radio size={14} className={connectionStatus === 'connected' ? 'text-green-600 animate-pulse' : 'text-amber-500'} />
              <span className="text-xs font-medium text-gray-700">Supabase Realtime IoT</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {connectionStatus === 'connected' ? 'Connected' : 'Syncing'}
            </span>
          </div>

          {connectionError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800">
              {connectionError}
            </div>
          )}

          {/* ESP32-S3 TFT LCD Display Simulator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Layar Pintu Loker (TFT LCD)
              </span>
              <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                Dapat Di-scan Kamera HP
              </span>
            </div>
            <LockerTftDisplay
              lockerCode={lockerNumber}
              isOccupied={true}
              userName={userName}
              qrPayload={qrPayload}
            />
          </div>

          {/* Animated 3D Hardware Locker Door & Solenoid Status */}
          <div className="flex flex-col items-center py-1">
            <div className="flex justify-center" style={{ perspective: '800px' }}>
              <div className="relative w-36 h-44 bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl border-4 border-gray-400 shadow-inner flex items-center justify-center overflow-hidden">
                {/* Locker interior chamber (visible when door opens) */}
                <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-3 text-center">
                  <div className={`w-3 h-3 rounded-full mb-1 ${isOpen ? 'bg-green-500 shadow-lg shadow-green-500/80 animate-ping' : 'bg-red-500'}`} />
                  <Unlock className="text-green-400 mx-auto" size={28} />
                  <p className="text-[11px] text-green-300 font-bold mt-1 tracking-wider">DOOR OPEN</p>
                  <p className="text-[8px] text-gray-400">Solenoid NC 12V Active</p>
                </div>

                {/* Physical Door Panel with 3D open swing transition */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800 rounded-lg border-2 border-gray-500 shadow-md transition-all duration-700 origin-left flex flex-col justify-between p-2.5"
                  style={{
                    transformOrigin: 'left center',
                    transform: isOpen ? 'rotateY(-85deg)' : 'rotateY(0deg)',
                    boxShadow: isOpen ? '5px 0 15px rgba(0,0,0,0.5)' : 'none',
                  }}
                >
                  <div className="space-y-1">
                    <div className="h-0.5 bg-gray-500 rounded" />
                    <div className="h-0.5 bg-gray-500 rounded" />
                    <div className="h-0.5 bg-gray-500 rounded" />
                  </div>

                  <div className="text-center bg-gray-900/70 rounded px-2 py-1 border border-gray-600">
                    <p className="text-[10px] font-bold text-white tracking-widest">{lockerNumber}</p>
                    <p className="text-[8px] text-emerald-400">TFT + RFID</p>
                  </div>

                  <div className="flex justify-end items-center pr-1">
                    <div className="w-2.5 h-6 bg-gray-300 rounded-sm shadow border border-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Solenoid Lock State Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 transition-colors ${
                  isOpen ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-600 border border-red-200'
                }`}
              >
                {isOpen ? <Unlock size={13} /> : <Lock size={13} />}
                {isOpen ? 'Solenoid UNLOCKED (5s)' : 'Solenoid LOCKED (NC)'}
              </span>
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => triggerUnlock('Simulated RFID Tap', 'RFID_TAP')}
              disabled={isOpen}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold disabled:opacity-50 transition-all shadow-sm active:scale-95"
            >
              <CreditCard size={15} className="text-amber-400" />
              Simulasi Tap Kartu RFID (A3:F2:9C:11)
            </button>

            <button
              onClick={() => triggerUnlock('Simulator Panel Trigger', 'REMOTE_APP')}
              disabled={isOpen}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-700 text-white text-xs font-semibold disabled:opacity-50 hover:bg-green-800 active:scale-95 transition-all shadow-sm"
            >
              <Zap size={15} />
              Simulasi Remote Unlock (door_command = UNLOCK)
            </button>
          </div>

          {/* Event log */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              IoT & Supabase Event Log
            </p>
            <div className="bg-gray-950 rounded-xl p-2.5 max-h-36 overflow-y-auto scrollbar-hide border border-gray-800 space-y-1">
              {lockerStatusLog.map((entry, i) => (
                <p key={i} className="text-[10px] text-green-400 font-mono leading-relaxed">
                  {entry}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
