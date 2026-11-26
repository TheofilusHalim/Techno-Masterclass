import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from '../utils/i18n'

const FAQ_ITEMS_ID = [
  {
    q: 'Bagaimana cara membuka kunci pintu loker?',
    a: 'Setelah memesan loker, buka menu "Scan" di aplikasi HP lalu arahkan kamera ke kode QR yang tampil pada layar LCD TFT pintu loker fisik. Pintu akan langsung terbuka secara otomatis selama 5 detik. Demi keamanan barang Anda, pembukaan loker hanya dapat dilakukan dengan memindai QR langsung di lokasi loker.',
  },
  {
    q: 'Apa yang terjadi jika waktu sewa habis?',
    a: 'Anda akan menerima notifikasi pengingat 10 menit sebelum waktu sewa berakhir. Anda dapat memperpanjang durasi (+1 jam) kapan saja melalui halaman Loker Saya agar terhindar dari denda keterlambatan.',
  },
  {
    q: 'Bagaimana cara mengecek ketersediaan loker?',
    a: 'Buka menu Beranda atau Cari Loker di aplikasi Titipin. Anda dapat melihat jumlah slot loker ukuran S, M, dan L yang tersedia secara real-time di setiap hub.',
  },
  {
    q: 'Barang apa saja yang muat di loker ukuran L?',
    a: 'Loker ukuran L mampu menampung tas carrier gunung 60–80L atau koper bagasi besar hingga 28–32 inch. Catatan: loker ukuran L selalu dihitung tarif per jam dan tidak termasuk dalam paket Member VIP.',
  },
  {
    q: 'Apa saja keuntungan Paket Member Bulanan (VIP)?',
    a: 'Paket Member VIP (Rp125.000/bulan) memberikan akses sewa bebas biaya jam untuk loker ukuran S dan M di seluruh hub Titipin Surabaya selama 30 hari (maksimal 3 loker aktif bersamaan). Loker ukuran L tetap dikenakan tarif Rp5.000/jam.',
  },
]

const FAQ_ITEMS_EN = [
  {
    q: 'How do I unlock my locker door?',
    a: 'After booking a locker, open the "Scan" tab in the app and point your camera at the QR code displayed on the locker LCD screen. The door will automatically unlock for 5 seconds. For your security, unlocking is only available by scanning the physical locker QR on site.',
  },
  {
    q: 'What happens when my time is up?',
    a: "You'll receive a notification 10 minutes before your time expires. You can extend by 1 hour at any time by tapping \"Extend +1 hr\" in the My Locker screen to avoid late fees.",
  },
  {
    q: 'How do I check locker availability?',
    a: 'Open the Home or Nearby Lockers screen in the Titipin app to see real-time availability of S, M, and L lockers at each hub.',
  },
  {
    q: 'What fits in an L-size locker?',
    a: 'The L-size locker fits a 60–80L carrier backpack or large 28–32 inch luggage. Note: L lockers are always billed per hour and are not included in the Monthly VIP Plan.',
  },
  {
    q: 'What does the Monthly VIP Plan cover?',
    a: 'The Monthly VIP Plan (Rp125,000/month) gives you free hourly rentals for Size S and M lockers across all Titipin hubs for 30 days (up to 3 simultaneous lockers). Size L lockers are billed at Rp5,000/hour.',
  },
]

export function FAQ() {
  const navigate = useNavigate()
  const { language } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const items = language === 'en' ? FAQ_ITEMS_EN : FAQ_ITEMS_ID

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label={language === 'en' ? 'Back' : 'Kembali'}
            className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">FAQ</h1>
            <p className="text-green-200 text-xs mt-0.5">
              {language === 'en' ? 'Frequently asked questions' : 'Pertanyaan yang sering diajukan'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`border rounded-2xl overflow-hidden transition-all ${
              openIndex === i ? 'border-green-300 shadow-sm' : 'border-gray-200'
            }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-4 text-left"
            >
              <span className={`text-sm font-semibold pr-3 ${openIndex === i ? 'text-green-700' : 'text-gray-800'}`}>
                {item.q}
              </span>
              {openIndex === i ? (
                <ChevronUp size={16} className="text-green-600 flex-shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
              )}
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}

        {/* Contact fallback */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-4">
          <p className="text-sm text-green-800 font-medium mb-1">
            {language === 'en' ? 'Still have questions?' : 'Masih ada pertanyaan?'}
          </p>
          <p className="text-xs text-green-700 mb-3">
            {language === 'en'
              ? 'Our support team is available every day 07:00–22:00 WIB.'
              : 'Tim layanan kami siap membantu setiap hari pukul 07:00–22:00 WIB.'}
          </p>
          <button
            onClick={() => navigate('/live-chat')}
            className="text-sm font-semibold text-green-700 hover:text-green-800 underline-offset-2 hover:underline"
          >
            {language === 'en' ? 'Chat with us →' : 'Hubungi kami via Live Chat →'}
          </button>
        </div>
      </div>
    </div>
  )
}
