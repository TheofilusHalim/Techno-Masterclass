import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Cpu, Lock, Unlock, Zap, Radio } from 'lucide-react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

export function SimulatorPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const {
    lockerStatus,
    isDoorOpen,
    lockerStatusLog,
    lockerNumber,
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
            if (newRow.is_door_open === true || newRow.status === 'unlocked') {
              setDoorOpenFromRealtime(true, `Supabase Realtime (is_door_open = true)`)
            } else if (newRow.is_door_open === false || newRow.status === 'occupied' || newRow.status === 'available') {
              setDoorOpenFromRealtime(false, `Supabase Realtime (is_door_open = false)`)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lockerNumber, setDoorOpenFromRealtime])

  const statusColors = {
    idle: 'bg-gray-100 text-gray-500',
    locked: 'bg-red-100 text-red-600',
    unlocked: 'bg-green-100 text-green-700',
  }

  // Visual open state
  const isOpen = isDoorOpen || lockerStatus === 'unlocked'

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
              <span className="text-xs font-medium text-gray-700">Supabase Realtime</span>
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

          {/* Active Locker info */}
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Active Unit (ESP32-S3)</p>
            <p className="text-2xl font-bold text-gray-800">{lockerNumber}</p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">Payload: TITIPIN:UK_PETRA:{lockerNumber}</p>
          </div>

          {/* Animated 3D Hardware Locker Door */}
          <div className="flex justify-center py-2" style={{ perspective: '800px' }}>
            <div className="relative w-36 h-48 bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl border-4 border-gray-400 shadow-inner flex items-center justify-center overflow-hidden">
              {/* Locker interior chamber (visible when door opens) */}
              <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-3 text-center">
                {/* Solenoid Lock Indicator */}
                <div className={`w-3 h-3 rounded-full mb-2 ${isOpen ? 'bg-green-500 shadow-lg shadow-green-500/80 animate-ping' : 'bg-red-500'}`} />
                <Unlock className="text-green-400 mx-auto" size={32} />
                <p className="text-[11px] text-green-300 font-bold mt-2 tracking-wider">DOOR OPEN</p>
                <p className="text-[9px] text-gray-400">Solenoid 12V Active</p>
              </div>

              {/* Physical Door Panel with 3D open swing transition */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800 rounded-lg border-2 border-gray-500 shadow-md transition-all duration-700 origin-left flex flex-col justify-between p-3"
                style={{
                  transformOrigin: 'left center',
                  transform: isOpen ? 'rotateY(-85deg)' : 'rotateY(0deg)',
                  boxShadow: isOpen ? '5px 0 15px rgba(0,0,0,0.5)' : 'none',
                }}
              >
                {/* Door vent slots */}
                <div className="space-y-1">
                  <div className="h-0.5 bg-gray-500 rounded" />
                  <div className="h-0.5 bg-gray-500 rounded" />
                  <div className="h-0.5 bg-gray-500 rounded" />
                </div>

                {/* Locker Number label on door */}
                <div className="text-center bg-gray-900/60 rounded px-2 py-1">
                  <p className="text-[11px] font-bold text-white tracking-widest">{lockerNumber}</p>
                </div>

                {/* Handle & Solenoid latch */}
                <div className="flex justify-end items-center pr-1">
                  <div className="w-2.5 h-8 bg-gray-300 rounded-sm shadow border border-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex justify-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 transition-colors ${
                isOpen ? statusColors.unlocked : statusColors[lockerStatus]
              }`}
            >
              {isOpen ? <Unlock size={13} /> : <Lock size={13} />}
              {isOpen ? 'UNLOCKED / OPEN (5s)' : lockerStatus}
            </span>
          </div>

          {/* Manual trigger for testing */}
          <button
            onClick={() => triggerUnlock('Simulator Panel')}
            disabled={isOpen}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-800 active:scale-95 transition-all shadow-sm"
          >
            <Zap size={15} />
            Test Open Locker (5s)
          </button>

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
