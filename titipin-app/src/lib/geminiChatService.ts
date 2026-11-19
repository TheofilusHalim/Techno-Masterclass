/**
 * Gemini AI Customer Support Service for Titipin 24/7 Live Chat
 */

const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
  ''
// Recommended fast & responsive model for chat interactions
const GEMINI_MODEL = 'gemini-3.5-flash-lite'

export interface ChatMessage {
  id: number
  from: 'user' | 'agent'
  text: string
  time: string
}

export interface UserContext {
  userName?: string
  userEmail?: string
  hasActiveLocker?: boolean
  lockerNumber?: string
  lockerLocation?: string
  remainingSeconds?: number
  hasMonthlyPlan?: boolean
  language?: 'id' | 'en'
  topic?: string
}

function buildSystemPrompt(ctx: UserContext): string {
  const lang = ctx.language || 'id'
  const userInfo = `
KONTEKS PENGGUNA SAAT INI:
- Nama Pengguna: ${ctx.userName || 'Pengguna Titipin'}
- Status Member VIP Langganan: ${ctx.hasMonthlyPlan ? 'Aktif (Member VIP 30 Hari)' : 'Tidak aktif (Pengguna Reguler)'}
- Status Loker Sedang Disewa: ${ctx.hasActiveLocker ? `YA (Loker ${ctx.lockerNumber || 'M-07'} di ${ctx.lockerLocation || 'Petra Christian University'}, sisa waktu ~${Math.ceil((ctx.remainingSeconds || 0) / 60)} menit)` : 'Tidak ada loker aktif saat ini'}
- Topik Percakapan: ${ctx.topic || 'Umum'}
`

  return `Kamu adalah "Titi", Asisten Customer Support resmi dari Titipin (Smart Digital Locker Ecosystem).
Tugasmu adalah membantu pelanggan Titipin secara ramah, sopan, ringkas, jelas, dan solutif selama 24/7.

${userInfo}

KNOWLEDGE BASE TITIPIN LENGKAP:
1. Tentang Titipin:
   - Jaringan loker pintar digital berbasis IoT pertama di Surabaya dengan integrasi hardware ESP32-S3, sensor pintu, LED status, dan QR scanner.
   - Lokasi Hub utama: Petra Christian University (Siwalankerto, Surabaya).

2. Ukuran & Tarif Loker:
   - Size Small (S): Rp4.000 / jam (helm, buku, tas selempang kecil)
   - Size Medium (M): Rp6.000 / jam (ransel laptop, tas kerja, belanjaan)
   - Size Large (L): Rp8.000 / jam (koper kabin, kardus, barang besar)
   - Paket Langganan VIP: Rp125.000 / 30 hari (sewa gratis sepuasnya untuk loker Small & Medium, hingga 3 loker bersamaan).

3. Cara Penggunaan & Pembayaran:
   - Pilih loker & durasi jam di aplikasi -> Bayar via QRIS atau E-Wallet (GoPay, OVO, Dana).
   - Setelah pembayaran sukses, buka menu "My Locker" / "Scan" untuk mendapatkan QR code unik.
   - Dekatkan layar HP ke QR Scanner fisik di lemari loker Titipin, pintu akan terbuka otomatis dalam 1 detik.
   - Pengguna juga dapat membuka pintu secara remote via tombol "Buka Loker" di aplikasi jika berada di depan loker.

4. Penanganan Kendala (Troubleshooting):
   - Pintu macet/tidak mau terbuka: Pandu pengguna menekan tombol "Buka Loker" di aplikasi atau arahkan untuk mencoba scan QR ulang. Jika masih gagal, beri tahu bahwa sistem akan melakukan remote override pembukaan darurat.
   - Waktu sewa habis/denda: Sewa dapat diperpanjang (Extend) kapan saja di aplikasi sebelum waktu habis. Denda keterlambatan adalah Rp5.000/jam jika melebihi batas waktu.
   - Barang tertinggal setelah sewa selesai: Hubungi tim keamanan/operasional Titipin di hub Petra Christian University dengan menunjukkan riwayat transaksi di aplikasi.

ATURAN MENJAWAB:
- Jawablah menggunakan bahasa ${lang === 'en' ? 'Inggris (English)' : 'Indonesia'} yang ramah, santun, dan bersahabat.
- Berikan jawaban yang ringkas dan langsung ke inti solusi (maksimal 2-4 kalimat atau bullet points singkat).
- Jika pengguna menanyakan status lokernya, gunakan data konteks pengguna yang disediakan di atas.
- Jangan mengarang data teknis di luar informasi di atas.
`
}

export async function askGeminiCustomerSupport(
  conversationHistory: ChatMessage[],
  newMessage: string,
  userContext: UserContext
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'Halo! Layanan AI CS sedang disiapkan. Ada yang bisa saya bantu terkait sewa loker Titipin?'
  }

  const systemInstruction = buildSystemPrompt(userContext)

  // Map conversation history to Gemini contents format
  const recentHistory = conversationHistory.slice(-8) // Last 8 messages for context
  const contents = [
    {
      role: 'user',
      parts: [{ text: systemInstruction }],
    },
    {
      role: 'model',
      parts: [{ text: 'Mengerti! Saya Titi, Customer Support Titipin siap melayani dengan ramah, solutif, dan ringkas.' }],
    },
    ...recentHistory.map((m) => ({
      role: m.from === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    {
      role: 'user',
      parts: [{ text: newMessage }],
    },
  ]

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => null)
      console.warn('Gemini API Error:', response.status, errData)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (text) {
      return text.trim()
    }

    throw new Error('No candidate content returned')
  } catch (error) {
    console.warn('Fallback to intelligent rule-based response:', error)
    // Intelligent contextual fallback if network fails
    const lower = newMessage.toLowerCase()
    if (lower.includes('buka') || lower.includes('unlock') || lower.includes('macet')) {
      return 'Jika pintu loker Anda belum terbuka, silakan gunakan tombol "Buka Loker" di tab My Locker atau tunjukkan QR Code ke scanner loker. Apakah Anda ingin saya kirimkan sinyal buka darurat?'
    }
    if (lower.includes('harga') || lower.includes('tarif') || lower.includes('biaya')) {
      return 'Tarif sewa Titipin: Ukuran S Rp4.000/jam, M Rp6.000/jam, L Rp8.000/jam. Tersedia juga Paket Member VIP Rp125.000/bulan untuk sewa loker S & M sepuasnya.'
    }
    return 'Halo! Saya Titi dari Titipin Support. Bagaimana saya dapat membantu kebutuhan loker pintar Anda hari ini?'
  }
}
