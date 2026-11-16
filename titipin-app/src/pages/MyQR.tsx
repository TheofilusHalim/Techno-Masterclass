import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, RefreshCw, Zap, ShieldCheck, CheckCircle2, AlertCircle, Radio, Sparkles } from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { useStore } from '../store/useStore'
import { validateAndUnlockByQR } from '../lib/lockerService'
import { formatTime } from '../utils/time'

export function MyQR() {
  const navigate = useNavigate()
  const {
    lockerNumber,
    lockerSize,
    lockerLocation,
    remainingSeconds,
    tickLockerTimer,
    triggerUnlock,
    isDoorOpen,
  } = useStore()

  const [scanResult, setScanResult] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = 'qr-reader-container'
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown timer for active locker
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickLockerTimer()
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tickLockerTimer])

  // Initialize and start Camera Scanner
  const startScanner = async () => {
    try {
      setErrorMessage(null)
      setScanStatus('scanning')

      // Stop existing instance if any
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      })
      scannerRef.current = html5QrCode

      const cameras = await Html5Qrcode.getCameras()
      if (!cameras || cameras.length === 0) {
        setCameraPermissionGranted(false)
        setErrorMessage('No camera device found on this device. You can use the Quick Test Scan button below.')
        setScanStatus('idle')
        return
      }

      setCameraPermissionGranted(true)

      // Prefer rear camera on mobile devices
      const selectedCamera = cameras.find((c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear')) || cameras[0]

      await html5QrCode.start(
        selectedCamera.id,
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // On successful scan
          handleQrScanned(decodedText)
        },
        () => {
          // Frame scan error (no QR detected in current frame) — normal, keep scanning
        }
      )
    } catch (err: unknown) {
      console.warn('Camera start error:', err)
      setCameraPermissionGranted(false)
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(
        msg.includes('NotAllowedError') || msg.includes('Permission')
          ? 'Camera permission was denied. Please allow camera access in browser settings, or use the quick test scan button below.'
          : 'Unable to start camera. You can use the quick test button below to verify the locker opening flow.'
      )
      setScanStatus('idle')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
      } catch (err) {
        console.warn('Stop scanner warning:', err)
      }
    }
  }

  // Start scanning on mount
  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
    }
  }, [])

  // Process Scanned QR
  const handleQrScanned = async (payload: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    setScanResult(payload)

    // Stop scanner temporarily on match
    await stopScanner()

    // Validate payload against active booking (TITIPIN:UK_PETRA:M-07)
    const result = await validateAndUnlockByQR(payload, lockerNumber)

    if (result.success) {
      setScanStatus('success')
      // Also update local store
      triggerUnlock(`QR Scanner (${payload})`, 'QR_SCAN')
    } else {
      setScanStatus('error')
      setErrorMessage(result.message)
    }

    setIsProcessing(false)
  }

  // Demo simulator scan trigger (for testing without physical camera)
  const handleSimulateScan = () => {
    const mockPayload = `TITIPIN:UK_PETRA:${lockerNumber}`
    handleQrScanned(mockPayload)
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
            className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Scan Locker QR</h1>
            <p className="text-green-200 text-xs mt-0.5">
              Active: Locker {lockerNumber} • {lockerLocation}
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
              Pindai kode QR yang tampil pada pintu loker fisik ({lockerNumber}) untuk membuka kunci secara instan.
            </p>
          </div>
        </div>

        {/* Camera Viewfinder Card */}
        <div className="w-full bg-black rounded-3xl overflow-hidden shadow-lg border border-gray-200 relative flex flex-col items-center justify-center min-h-[300px]">
          {/* html5-qrcode video element renders inside here */}
          <div
            id={scannerContainerId}
            className={`w-full ${scanStatus === 'success' ? 'opacity-30' : 'opacity-100'} transition-opacity`}
            style={{ width: '100%', minHeight: '280px' }}
          />

          {/* Scanner laser overlay when scanning */}
          {scanStatus === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div className="w-56 h-56 border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {/* Corner markers */}
                <span className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm -mt-0.5 -ml-0.5" />
                <span className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm -mt-0.5 -mr-0.5" />
                <span className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm -mb-0.5 -ml-0.5" />
                <span className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm -mb-0.5 -mr-0.5" />

                {/* Laser scan line animation */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="text-white text-xs font-medium mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
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
              <h3 className="text-lg font-bold">Loker {lockerNumber} Terverifikasi!</h3>
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

          {/* Error / Permission Denied Overlay */}
          {cameraPermissionGranted === false && scanStatus !== 'success' && (
            <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center p-6 text-white text-center">
              <AlertCircle size={36} className="text-amber-400 mb-2" />
              <p className="text-sm font-semibold">Kamera Tidak Tersedia</p>
              <p className="text-xs text-gray-300 mt-1 max-w-[260px] leading-relaxed">
                {errorMessage || 'Akses kamera browser belum diberikan.'}
              </p>
              <button
                onClick={handleSimulateScan}
                className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles size={16} />
                Simulasi Scan QR Loker {lockerNumber}
              </button>
            </div>
          )}
        </div>

        {/* Quick Testing Trigger Button (Crucial for Demo & Desktop Testing) */}
        <div className="w-full">
          <button
            onClick={handleSimulateScan}
            disabled={isDoorOpen}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 active:scale-98 border border-emerald-300 rounded-2xl text-xs font-semibold text-emerald-800 transition-all shadow-sm"
          >
            <Sparkles size={15} className="text-emerald-600" />
            <span>Simulasi Scan QR LCD ({lockerNumber})</span>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full font-mono">
              TITIPIN:UK_PETRA:{lockerNumber}
            </span>
          </button>
        </div>

        {/* Remote Unlock & Fallback Card */}
        <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Akses Cadangan (Fallback)</p>
              <p className="text-xs font-bold text-gray-800">Tanpa Scan QR LCD</p>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-green-700 bg-green-100 px-2.5 py-1 rounded-full font-medium">
              <Radio size={12} className="animate-pulse" /> Online
            </span>
          </div>

          {/* Remote Open Button */}
          <button
            onClick={() => triggerUnlock('Remote Unlock Button (MyQR)', 'REMOTE_APP')}
            disabled={isDoorOpen}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${
              isDoorOpen
                ? 'bg-green-600 text-white animate-pulse'
                : 'bg-green-700 text-white hover:bg-green-800 active:scale-95'
            }`}
          >
            <Zap size={16} />
            {isDoorOpen ? 'Pintu Terbuka (5 detik)...' : 'Buka Kunci Jarak Jauh (Remote Unlock)'}
          </button>

          {/* RFID Fallback info */}
          <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-500 border-t border-gray-200">
            <ShieldCheck size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Akses Kartu RFID:</strong> Anda juga dapat langsung menempelkan kartu RFID terdaftar pada modul sensor pintu loker fisik.
            </span>
          </div>
        </div>

        {/* Active Locker Info Card */}
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
      </div>
    </div>
  )
}
