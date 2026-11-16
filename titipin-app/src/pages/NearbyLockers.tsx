import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Clock, ChevronRight, ArrowLeft, Loader2, Radio } from 'lucide-react'
import { useStore } from '../store/useStore'
import { fetchHubsWithAvailability, type HubWithStats } from '../lib/lockerService'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'campus', label: 'Campus' },
  { key: 'station', label: 'Station' },
  { key: 'mall', label: 'Mall' },
]

export function NearbyLockers() {
  const navigate = useNavigate()
  const { setSelectedHub, connectionStatus } = useStore()
  const [hubs, setHubs] = useState<HubWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const loadData = async () => {
    const { data } = await fetchHubsWithAvailability()
    if (data && data.length > 0) {
      setHubs(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    // Realtime subscription on lockers table
    const channel = supabase
      .channel('nearby:lockers_listener')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lockers' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = hubs.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.sub_location && h.sub_location.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = activeCategory === 'all' || h.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleSelectHub = (hub: HubWithStats) => {
    setSelectedHub(hub.name, hub.id)
    navigate('/hub-detail')
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors">
              <ArrowLeft size={18} className="text-white" />
            </button>
            <h1 className="text-white text-xl font-bold">Nearby Lockers</h1>
          </div>
          <span className="flex items-center gap-1 text-[10px] bg-green-800 text-green-200 px-2 py-0.5 rounded-full">
            <Radio size={10} className={connectionStatus === 'connected' ? 'text-green-300 animate-pulse' : 'text-amber-400'} />
            Supabase Live
          </span>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search campus or station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-xl pl-9 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {/* Category pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === key
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Last used quick button */}
        {!search && hubs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Last used</p>
            <button
              onClick={() => handleSelectHub(hubs[0])}
              className="flex items-center gap-2 text-sm text-green-700 font-medium hover:underline"
            >
              <Clock size={14} />
              {hubs[0].name}
            </button>
          </div>
        )}

        {/* Hub list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin text-green-600 mb-2" />
            <p className="text-sm">Connecting to Supabase lockers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MapPin size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hubs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((hub) => (
              <button
                key={hub.id}
                onClick={() => handleSelectHub(hub)}
                className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:border-green-300 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-800 text-sm truncate">{hub.name}</p>
                      <span className="flex-shrink-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {hub.total_available} free
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{hub.sub_location || hub.address}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {hub.distance_km ?? 0.1} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {hub.walk_minutes ?? 2} min walk
                      </span>
                    </div>

                    {/* Live slot counts from lockers table */}
                    <div className="flex gap-2 mt-2.5">
                      {(['S', 'M', 'L'] as const).map((s) => {
                        const count = hub.slots[s]
                        return (
                          <span
                            key={s}
                            className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${
                              count > 0
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-red-50 text-red-400 line-through'
                            }`}
                          >
                            {s}: <strong className={count > 0 ? 'text-green-700' : 'text-red-400'}>{count}</strong>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1 ml-2" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
