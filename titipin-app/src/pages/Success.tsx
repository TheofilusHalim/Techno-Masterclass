import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Camera, Package, Home, Crown, User } from 'lucide-react'
import { useStore } from '../store/useStore'

export function Success() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isSubscription = searchParams.get('type') === 'subscription'
  const { lockerNumber, lockerLocation, lockerSize } = useStore()

  if (isSubscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 bg-white text-center">
        {/* Success icon */}
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-amber-100 ring-8 ring-amber-50 flex items-center justify-center shadow-xs">
            <Crown size={40} className="text-amber-600" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Langganan Aktif!</h1>
        <p className="text-lg text-green-800 font-bold mb-1">Selamat Datang di Member VIP</p>
        <p className="text-xs text-gray-500 mb-6 font-medium">
          Akses loker Size S & M bebas biaya di seluruh Hub Titipin (30 Hari)
        </p>

        {/* Benefits list */}
        <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-left space-y-3 shadow-xs">
          {[
            { step: '1', title: 'Bebas Jam Sewa', desc: 'Gunakan loker Size S & M tanpa perlu bayar tarif per jam.' },
            { step: '2', title: 'Hingga 3 Loker Sekaligus', desc: 'Dapat memesan hingga 3 slot loker aktif secara simultan.' },
            { step: '3', title: 'Prioritas Hub', desc: 'Akses instan di semua stasiun, kampus, dan pusat perbelanjaan.' },
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
            onClick={() => navigate('/nearby-lockers')}
            className="w-full py-4 bg-green-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-700/30 hover:bg-green-800 active:scale-95 transition-all"
          >
            <Package size={18} />
            Pesan Loker Sekarang
          </button>

          <button
            onClick={() => navigate('/account')}
            className="w-full py-3.5 bg-green-50 text-green-800 border border-green-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-100 active:scale-95 transition-all"
          >
            <User size={18} />
            Lihat Status Akun Saya
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

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 bg-white text-center">
      {/* Success icon */}
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 ring-8 ring-emerald-50 flex items-center justify-center shadow-xs">
          <CheckCircle2 size={44} className="text-emerald-700" />
        </div>
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Pemesanan Berhasil!</h1>
      <p className="text-lg text-green-800 font-bold mb-1">Loker {lockerNumber} Siap Digunakan</p>
      <p className="text-xs text-gray-500 mb-6 font-medium">
        Ukuran {lockerSize} • {lockerLocation}
      </p>

      {/* Instructions: QR Scan Only */}
      <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-left space-y-3 shadow-xs">
        {[
          { step: '1', title: 'Tuju Loker Anda', desc: `Datang ke ${lockerLocation} dan cari pintu nomor ${lockerNumber}.` },
          { step: '2', title: 'Scan QR di Layar LCD', desc: 'Gunakan kamera HP di aplikasi untuk scan QR dinamis pada pintu loker.' },
          { step: '3', title: 'Bebas Denda', desc: 'Perpanjang sewa kapan saja dari aplikasi jika butuh waktu lebih lama.' },
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
          Lihat Loker Saya
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
