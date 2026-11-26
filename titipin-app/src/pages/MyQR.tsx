import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { useStore } from '../store/useStore'
import { validateAndUnlockByQR } from '../lib/lockerService'
import { formatTime } from '../utils/time'

// Module-level serialized camera queue & active scanner ref to prevent
// concurrent camera starts (e.g. React StrictMode double-mount) or orphaned MediaStreams.
let cameraOpQueue: Promise<void> = Promise.resolve()
let activeGlobalScanner: Html5Qrcode | null = null

function enqueueCameraOp(op: () => Promise<void>): Promise<void> {
  const next = cameraOpQueue.then(op, op)
  cameraOpQueue = next.catch(() => {})
  return next
}

function releaseAllVideoTracks(containerId: string) {
  const container = document.getElementById(containerId)
  if (!container) return
  container.querySelectorAll('video').forEach((video) => {
    const stream = video.srcObject as MediaStream | null
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
  })
}

async function stopActiveGlobalScanner(containerId: string) {
  const scanner = activeGlobalScanner
  activeGlobalScanner = null
  if (scanner) {
    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
    } catch (err) {
      console.warn('Stop scanner warning:', err)
    }
    try {
      scanner.clear()
    } catch {
      // ignore clear error
    }
  }
  releaseAllVideoTracks(containerId)
}

export function MyQR() {
  const navigate = useNavigate()
  const {
    hasActiveLocker,
    activeBookings,
    selectedActiveBookingIndex,
    selectActiveBooking,
    loadActiveBooking,
    userId,
    lockerNumber,
    lockerSize,
    lockerLocation,
    remainingSeconds,
    tickLockerTimer,
    triggerUnlock,
  } = useStore()

  const [scanResult, setScanResult] = useState<string | null>(null)
  const [scannedLockerNum, setScannedLockerNum] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [requiresFinePayment, setRequiresFinePayment] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [, setNowTick] = useState(() => Date.now())

  const scannerContainerId = 'qr-reader-container'
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)
  const startAttemptRef = useRef(0)

  const hasActiveSession = activeBookings.length > 0 || (hasActiveLocker && Boolean(lockerNumber))

  const stopScanner = () =>
    enqueueCameraOp(async () => {
      await stopActiveGlobalScanner(scannerContainerId)
    })

  useEffect(() => {
    loadActiveBooking(userId || undefined)
  }, [loadActiveBooking, userId])

  // Countdown timer for active lockers
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickLockerTimer()
      setNowTick(Date.now())
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tickLockerTimer])

  // Initialize and start Camera Scanner (strictly serialized via cameraOpQueue)
  const startScanner = () => {
    const attemptId = ++startAttemptRef.current
    return enqueueCameraOp(async () => {
      try {
        await stopActiveGlobalScanner(scannerContainerId)

        if (!isMountedRef.current || attemptId !== startAttemptRef.current) {
          releaseAllVideoTracks(scannerContainerId)
          return
        }

        setErrorMessage(null)
        setScanStatus('scanning')

        const cameras = await Html5Qrcode.getCameras()
        if (!isMountedRef.current || attemptId !== startAttemptRef.current) {
          releaseAllVideoTracks(scannerContainerId)
          return
        }

        if (!cameras || cameras.length === 0) {
          setCameraPermissionGranted(false)
          setErrorMessage('Perangkat kamera tidak ditemukan. Pastikan kamera tersedia dan aktif.')
          setScanStatus('idle')
          return
        }

        const containerEl = document.getElementById(scannerContainerId)
        if (!containerEl) return

        setCameraPermissionGranted(true)

        const html5QrCode = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        })
        activeGlobalScanner = html5QrCode

        // Prefer rear camera on mobile devices
        const selectedCamera =
          cameras.find((c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear')) ||
          cameras[0]

        await html5QrCode.start(
          selectedCamera.id,
          {
            fps: 10,
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            handleQrScanned(decodedText)
          },
          () => {
            // Frame scan error (no QR detected in current frame) — normal, keep scanning
          }
        )

        // If component unmounted or superseded while camera was opening, immediately stop and release hardware
        if (!isMountedRef.current || attemptId !== startAttemptRef.current) {
          await stopActiveGlobalScanner(scannerContainerId)
        }
      } catch (err: unknown) {
        await stopActiveGlobalScanner(scannerContainerId)
        if (!isMountedRef.current || attemptId !== startAttemptRef.current) {
          return
        }
        console.warn('Camera start error:', err)
        setCameraPermissionGranted(false)
        const msg = err instanceof Error ? err.message : String(err)
        setErrorMessage(
          msg.includes('NotAllowedError') || msg.includes('Permission')
            ? 'Izin kamera ditolak. Harap aktifkan akses kamera di pengaturan perangkat Anda untuk memindai QR loker.'
            : 'Tidak dapat memulai kamera. Pastikan kamera tidak sedang digunakan aplikasi lain, lalu coba lagi.'
        )
        setScanStatus('idle')
      }
    })
  }

  // Start scanning on mount and always release camera on unmount / pagehide
  useEffect(() => {
    isMountedRef.current = true
    void startScanner()

    const handlePageHide = () => {
      isMountedRef.current = false
      startAttemptRef.current += 1
      releaseAllVideoTracks(scannerContainerId)
      void stopScanner()
    }
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      isMountedRef.current = false
      startAttemptRef.current += 1
      releaseAllVideoTracks(scannerContainerId)
      void stopScanner()
    }
  }, [])

  // Process Scanned QR
  const handleQrScanned = async (payload: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    setScanResult(payload)

    // Stop scanner temporarily on match
    await stopScanner()

    // Validate payload against ALL active/overdue bookings of this user in Supabase
    const result = await validateAndUnlockByQR(payload, lockerNumber, userId || undefined)

    if (result.success) {
      setRequiresFinePayment(false)
      setScannedLockerNum(result.lockerNumber)
      setScanStatus('success')
      // Match selected booking in store if present so local UI reflects unlock
      const idx = activeBookings.findIndex(
        (b) => b.locker?.locker_number?.toUpperCase() === result.lockerNumber.toUpperCase()
      )
      if (idx >= 0) selectActiveBooking(idx)
      triggerUnlock(`QR Scanner (${payload})`, 'QR_SCAN')
      loadActiveBooking(userId || undefined)
    } else {
      setRequiresFinePayment(Boolean(result.requiresPayment))
      setScanStatus('error')
      setErrorMessage(result.message)
    }

    setIsProcessing(false)
  }

  const handleResetScan = () => {
    setScanResult(null)
    setScanStatus('scanning')
    setErrorMessage(null)
    startScanner()
  }

  return (
    <div className="flex flex-col min-h-full bg-white pb-6">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Scan QR Loker</h1>
            <p className="text-green-200 text-xs mt-0.5">
              {hasActiveSession
                ? activeBookings.length > 1
                  ? `${activeBookings.length} loker aktif • ${lockerLocation}`
                  : `Loker aktif: ${lockerNumber} • ${lockerLocation}`
                : 'Pindai QR pada layar LCD loker untuk membuka pintu'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-5 space-y-4">
        {/* Instructions banner */}
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <Camera size={16} />
          </div>
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong>Arahkan kamera ke layar LCD TFT loker.</strong>
            <p className="text-emerald-700 mt-0.5">
              {hasActiveSession && lockerNumber
                ? `Pindai kode QR yang tampil pada pintu loker fisik (${lockerNumber}) untuk membuka kunci secara instan.`
                : 'Pindai kode QR yang tampil pada layar LCD pintu loker fisik untuk membuka kunci secara instan.'}
            </p>
          </div>
        </div>

        {/* Camera Viewfinder Card */}
        <div className="w-full aspect-square max-h-[360px] bg-black rounded-3xl overflow-hidden shadow-lg border border-gray-200 relative">
          {/* html5-qrcode video element renders full-bleed inside here */}
          <div
            id={scannerContainerId}
            className={`w-full h-full ${scanStatus === 'success' ? 'opacity-30' : 'opacity-100'} transition-opacity`}
          />

          {/* Single synchronized green scan frame centered precisely in viewfinder */}
          {scanStatus === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-52 h-52 sm:w-56 sm:h-56 border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Corner markers */}
                  <span className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md -mt-0.5 -ml-0.5" />
                  <span className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md -mt-0.5 -mr-0.5" />
                  <span className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md -mb-0.5 -ml-0.5" />
                  <span className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md -mb-0.5 -mr-0.5" />

                  {/* Laser scan line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>
              <p className="absolute bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-white text-xs font-medium bg-black/65 px-3.5 py-1.5 rounded-full backdrop-blur-xs border border-white/10">
                Posisikan QR LCD Loker di dalam kotak
              </p>
            </div>
          )}

          {/* Success Overlay */}
          {scanStatus === 'success' && (
            <div className="absolute inset-0 bg-green-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-white text-green-700 flex items-center justify-center shadow-lg mb-3 animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-lg font-bold">Loker {scannedLockerNum || lockerNumber} Terverifikasi!</h3>
              {scanResult && (
                <p className="text-[10px] bg-green-800/80 text-green-200 px-2 py-0.5 rounded-full font-mono mt-1">
                  Payload: {scanResult}
                </p>
              )}
              <p className="text-green-100 text-xs mt-1.5 max-w-[240px]">
                Solenoid pintu loker terbuka selama 5 detik. Silakan masukkan atau ambil barang Anda.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleResetScan}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={14} /> Scan Lagi
                </button>
                <button
                  onClick={() => navigate('/my-locker')}
                  className="px-4 py-2 bg-white text-green-800 rounded-xl text-xs font-bold shadow-md hover:bg-green-50 transition-colors"
                >
                  Ke My Locker →
                </button>
              </div>
            </div>
          )}

          {/* Scan Error Overlay (Account mismatch or Overdue payment required) */}
          {scanStatus === 'error' && (
            <div className="absolute inset-0 bg-rose-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
              <AlertCircle size={36} className="text-rose-400 mb-2" />
              <p className="text-sm font-bold">
                {requiresFinePayment ? 'Wajib Lunasi Denda Dulu' : 'QR Tidak Cocok dengan Akun'}
              </p>
              <p className="text-xs text-rose-200 mt-1 max-w-[260px] leading-relaxed">
                {errorMessage || 'Loker ini tidak terdaftar pada sesi sewa aktif akun Anda.'}
              </p>
              <div className="mt-4 flex gap-2">
                {requiresFinePayment ? (
                  <button
                    onClick={() => navigate('/my-locker')}
                    className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-400 transition-all"
                  >
                    Bayar Denda di Loker Saya →
                  </button>
                ) : (
                  <button
                    onClick={handleResetScan}
                    className="px-4 py-2 bg-white text-rose-900 rounded-xl text-xs font-bold shadow-md hover:bg-rose-50 transition-all"
                  >
                    <RefreshCw size={13} className="inline mr-1" /> Scan Ulang
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error / Permission Denied Overlay */}
          {cameraPermissionGranted === false && scanStatus !== 'success' && scanStatus !== 'error' && (
            <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center p-6 text-white text-center">
              <AlertCircle size={36} className="text-amber-400 mb-2" />
              <p className="text-sm font-semibold">Kamera Tidak Tersedia</p>
              <p className="text-xs text-gray-300 mt-1 max-w-[260px] leading-relaxed">
                {errorMessage || 'Akses kamera belum diberikan.'}
              </p>
              <button
                onClick={startScanner}
                className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw size={15} />
                Coba Aktifkan Kamera
              </button>
            </div>
          )}
        </div>

        {/* Active Locker Info Cards — ONLY rendered when user has active locker rental(s) */}
        {hasActiveSession && (
          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold text-gray-600">
                Sesi Sewa Aktif ({activeBookings.length > 0 ? activeBookings.length : 1})
              </p>
              {activeBookings.length > 1 && (
                <p className="text-[11px] text-gray-400">Otomatis cocokkan saat scan QR</p>
              )}
            </div>

            {activeBookings.length > 0 ? (
              activeBookings.map((b, idx) => {
                const bLockerNum = b.locker?.locker_number || '-'
                const bSize = b.locker?.size || 'M'
                const bHub = b.hub?.name || 'Titipin Hub'
                const bRemaining = Math.max(0, Math.floor((new Date(b.expires_at).getTime() - Date.now()) / 1000))
                const bOverdue = b.status === 'overdue' || bRemaining === 0
                const isSelected = idx === selectedActiveBookingIndex

                return (
                  <button
                    key={b.id || idx}
                    type="button"
                    onClick={() => selectActiveBooking(idx)}
                    className={`w-full text-left bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border-2 transition-all ${
                      isSelected ? 'border-green-600 bg-green-50/30' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-gray-800">Loker {bLockerNum}</p>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Terpilih
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Ukuran {bSize} • {bHub}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400 font-medium">
                        {bOverdue ? 'Status' : 'Sisa Waktu'}
                      </p>
                      <p className={`text-lg font-bold font-mono ${bOverdue ? 'text-rose-600' : 'text-green-700'}`}>
                        {bOverdue ? 'TERLAMBAT' : formatTime(bRemaining)}
                      </p>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Sesi Sewa Aktif</p>
                  <p className="text-base font-bold text-gray-800">Loker {lockerNumber}</p>
                  <p className="text-xs text-gray-500">Ukuran {lockerSize} • {lockerLocation}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 font-medium">Sisa Waktu</p>
                  <p className="text-lg font-bold text-green-700 font-mono">{formatTime(remainingSeconds)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
