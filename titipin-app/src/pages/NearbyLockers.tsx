import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Clock, ChevronRight, ArrowLeft } from 'lucide-react'
import { useStore } from '../store/useStore'

const HUBS = [
  {
    id: 'petra',
    name: 'Petra Christian University',
    sub: 'Gedung P lobby',
    category: 'campus',
    distance: '0.1 km',
    walkTime: '2 min',
    slots: { S: 4, M: 3, L: 1 },
    total: 8,
  },
  {
    id: 'petra-lib',
    name: 'Petra Library Hub',
    sub: 'UPT Perpustakaan, Lt. 1',
    category: 'campus',
    distance: '0.3 km',
    walkTime: '5 min',
    slots: { S: 2, M: 2, L: 0 },
    total: 4,
  },
  {
    id: 'gubeng',
    name: 'Gubeng Station',
    sub: 'Hall timur, dekat pintu masuk',
    category: 'station',
    distance: '2.4 km',
    walkTime: '12 min',
    slots: { S: 6, M: 4, L: 2 },
    total: 12,
  },
  {
    id: 'tp',
    name: 'Tunjungan Plaza',
    sub: 'Basement B2, Area Parkir Motor',
    category: 'mall',
    distance: '3.1 km',
    walkTime: '18 min',
    slots: { S: 3, M: 0, L: 1 },
    total: 4,
  },
]

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'campus', label: 'Campus' },
  { key: 'station', label: 'Station' },
  { key: 'mall', label: 'Mall' },
]

export function NearbyLockers() {
  const navigate = useNavigate()
  const { setSelectedHub } = useStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = HUBS.filter((h) => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || h.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleSelectHub = (hub: typeof HUBS[0]) => {
    setSelectedHub(hub.name)
    navigate('/hub-detail')
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">Nearby Lockers</h1>
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

        {/* Last used */}
        {!search && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Last used</p>
            <button
              onClick={() => handleSelectHub(HUBS[0])}
              className="flex items-center gap-2 text-sm text-green-700 font-medium"
            >
              <Clock size={14} />
              Petra Christian University
            </button>
          </div>
        )}

        {/* Hub list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MapPin size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hubs found</p>
            </div>
          ) : (
            filtered.map((hub) => (
              <button
                key={hub.id}
                onClick={() => handleSelectHub(hub)}
                className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:border-green-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-800 text-sm truncate">{hub.name}</p>
                      <span className="flex-shrink-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {hub.total} free
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{hub.sub}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {hub.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {hub.walkTime} walk
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {(['S', 'M', 'L'] as const).map((s) => (
                        <span
                          key={s}
                          className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${
                            hub.slots[s] > 0
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-50 text-red-400 line-through'
                          }`}
                        >
                          {s} {hub.slots[s]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1 ml-2" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
