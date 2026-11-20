import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import type { HubWithStats } from '../lib/lockerService'

// Fix default Leaflet marker icon broken in Vite/Webpack
// We use custom divIcon so this is not needed, but let's delete default anyway
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LiveMapProps {
  hubs: HubWithStats[]
  onSelectHub?: (hub: HubWithStats) => void
}

/** Category → emoji label */
function categoryEmoji(category: string) {
  if (category === 'campus') return '🎓'
  if (category === 'station') return '🚉'
  if (category === 'mall') return '🛍️'
  return '📦'
}

export function LiveMap({ hubs, onSelectHub }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const userMarkerRef = useRef<L.Marker | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'ok' | 'denied'>('loading')

  // Default center: Petra Christian University
  const DEFAULT_LAT = -7.3131
  const DEFAULT_LNG = 112.7193

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Init map
    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_LAT, DEFAULT_LNG],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    })

    // OpenStreetMap tile layer (free, no key)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    // Minimal attribution bottom-left
    L.control.attribution({ prefix: false, position: 'bottomleft' }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Add / refresh hub markers when hubs change
  useEffect(() => {
    const map = mapRef.current
    if (!map || hubs.length === 0) return

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    hubs.forEach((hub) => {
      if (!hub.lat || !hub.lng) return

      const available = hub.total_available ?? 0
      const badgeColor = available > 0 ? '#15803d' : '#ef4444'
      const emoji = categoryEmoji(hub.category ?? '')

      // Custom div icon
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            position:relative;
            display:flex;
            flex-direction:column;
            align-items:center;
          ">
            <div style="
              background:white;
              border:2.5px solid ${badgeColor};
              border-radius:12px;
              padding:3px 7px;
              font-size:11px;
              font-weight:700;
              color:${badgeColor};
              white-space:nowrap;
              box-shadow:0 2px 8px rgba(0,0,0,0.18);
              display:flex;
              align-items:center;
              gap:4px;
            ">
              <span>${emoji}</span>
              <span>${available} free</span>
            </div>
            <div style="
              width:0;height:0;
              border-left:6px solid transparent;
              border-right:6px solid transparent;
              border-top:8px solid ${badgeColor};
              margin-top:-1px;
            "></div>
          </div>
        `,
        iconSize: [80, 44],
        iconAnchor: [40, 44],
        popupAnchor: [0, -44],
      })

      const marker = L.marker([hub.lat, hub.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-size:13px;min-width:140px">
            <strong>${hub.name}</strong><br/>
            <span style="color:#6b7280;font-size:11px">${hub.sub_location ?? ''}</span><br/>
            <span style="color:#15803d;font-weight:600">${available} locker tersedia</span>
          </div>`,
          { closeButton: false }
        )

      marker.on('click', () => {
        onSelectHub?.(hub)
      })

      markersRef.current.push(marker)
    })
  }, [hubs, onSelectHub])

  const fitToHubs = useCallback(() => {
    if (hubs.length > 0 && mapRef.current) {
      const pts = hubs
        .filter((h) => h.lat && h.lng)
        .map((h) => [h.lat!, h.lng!] as L.LatLngExpression)
      if (pts.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(pts), { padding: [32, 32], maxZoom: 15 })
      }
    }
  }, [hubs])

  // Get user GPS location via Capacitor Native Plugin (with runtime permission prompt) or Browser fallback
  const fetchUserLocation = useCallback(async () => {
    const map = mapRef.current
    if (!map) return

    setLocationStatus('loading')

    const createPulsingUserMarker = (lat: number, lng: number) => {
      userMarkerRef.current?.remove()
      const userIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:16px;height:16px;
            background:#3b82f6;
            border:3px solid white;
            border-radius:50%;
            box-shadow:0 0 0 4px rgba(59,130,246,0.3);
            animation:pulse-map 1.5s infinite;
          "></div>
          <style>
            @keyframes pulse-map {
              0%,100%{box-shadow:0 0 0 4px rgba(59,130,246,0.3)}
              50%{box-shadow:0 0 0 10px rgba(59,130,246,0.1)}
            }
          </style>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>Lokasi kamu</strong>', { closeButton: false })

      const allPoints: L.LatLngExpression[] = [[lat, lng]]
      hubs.forEach((h) => {
        if (h.lat && h.lng) allPoints.push([h.lat, h.lng])
      })
      if (allPoints.length > 1) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [32, 32], maxZoom: 15 })
      } else {
        map.setView([lat, lng], 15)
      }
      setLocationStatus('ok')
    }

    try {
      // 1. If running natively on Android, explicitly request permission so Android popup appears
      if (Capacitor.isNativePlatform()) {
        const check = await Geolocation.checkPermissions()
        if (check.location !== 'granted') {
          const req = await Geolocation.requestPermissions()
          if (req.location !== 'granted') {
            setLocationStatus('denied')
            fitToHubs()
            return
          }
        }
      }

      // 2. Fetch current high-accuracy coordinates
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      })

      createPulsingUserMarker(coordinates.coords.latitude, coordinates.coords.longitude)
    } catch (err) {
      console.warn('Capacitor Geolocation error, trying browser fallback:', err)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            createPulsingUserMarker(pos.coords.latitude, pos.coords.longitude)
          },
          () => {
            setLocationStatus('denied')
            fitToHubs()
          },
          { enableHighAccuracy: true, timeout: 8000 }
        )
      } else {
        setLocationStatus('denied')
        fitToHubs()
      }
    }
  }, [hubs, fitToHubs])

  useEffect(() => {
    fetchUserLocation()
  }, [fetchUserLocation])

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-green-200 shadow-sm" style={{ height: 192 }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Location status badge with clickable retry */}
      <button
        onClick={() => fetchUserLocation()}
        type="button"
        className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-medium shadow-md transition-all active:scale-95 cursor-pointer hover:bg-white"
        title="Klik untuk mendeteksi ulang lokasi GPS"
      >
        {locationStatus === 'loading' && <span className="text-gray-600 animate-pulse">📍 Mencari lokasi…</span>}
        {locationStatus === 'ok' && <span className="text-blue-600 font-semibold">📍 Lokasi ditemukan</span>}
        {locationStatus === 'denied' && (
          <span className="text-orange-600 font-semibold flex items-center gap-1">
            📍 GPS tidak aktif • <span className="underline">Minta Akses</span>
          </span>
        )}
      </button>

      {/* OSM attribution badge */}
      <div className="absolute bottom-2 right-2 z-[1000] bg-white/80 px-1.5 py-0.5 rounded text-[9px] text-gray-500">
        © OpenStreetMap
      </div>
    </div>
  )
}
