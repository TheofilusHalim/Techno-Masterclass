import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Camera, Package, Home } from 'lucide-react'
import { useStore } from '../store/useStore'

export function Success() {
  const navigate = useNavigate()
  const { lockerNumber, lockerLocation, lockerSize } = useStore()

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 bg-white text-center">
      {/* Success icon */}
      <div className="relative mb-5">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center shadow-inner">
          <CheckCircle2 size={56} className="text-green-700" />
        </div>
        <div className="absolute -right-1 -top-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-md">
          <span className="text-white text-base">🎉</span>
        </div>
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Pemesanan Berhasil!</h1>
      <p className="text-lg text-green-800 font-bold mb-1">Loker {lockerNumber} Siap Digunakan</p>
      <p className="text-xs text-gray-500 mb-6 font-medium">
        Ukuran {lockerSize} • {lockerLocation}
      </p>

      {/* Instructions: Modern QR Scan & Remote Unlock (No outdated PIN) */}
      <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-left space-y-3 shadow-xs">
        {[
          { step: '1', title: 'Tuju Loker Anda', desc: `Datang ke ${lockerLocation} dan cari pintu nomor ${lockerNumber}.` },
          { step: '2', title: 'Scan QR di Layar LCD', desc: 'Gunakan kamera HP di aplikasi untuk scan QR dinamis pada pintu loker.' },
          { step: '3', title: 'Remote Unlock Cadangan', desc: 'Bisa juga tekan tombol Buka Kunci Jarak Jauh di aplikasi via internet.' },
          { step: '4', title: 'Bebas Denda', desc: 'Perpanjang sewa kapan saja dari aplikasi jika butuh waktu lebih lama.' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-green-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
              {step}
            </span>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-800">{title}</p>
              <p className="text-[11px] text-gray-500 leading-snug">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="w-full space-y-2.5">
        <button
          onClick={() => navigate('/my-qr')}
          className="w-full py-4 bg-green-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-700/30 hover:bg-green-800 active:scale-95 transition-all"
        >
          <Camera size={18} />
          Scan Locker QR (Buka Kamera)
        </button>

        <button
          onClick={() => navigate('/my-locker')}
          className="w-full py-3.5 bg-green-50 text-green-800 border border-green-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-100 active:scale-95 transition-all"
        >
          <Package size={18} />
          Lihat Loker Saya & Remote Unlock
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 text-gray-500 font-semibold text-xs flex items-center justify-center gap-1.5 hover:text-gray-800 transition-colors"
        >
          <Home size={15} />
          Kembali ke Beranda
        </button>
      </div>
    </div>
  )
}
