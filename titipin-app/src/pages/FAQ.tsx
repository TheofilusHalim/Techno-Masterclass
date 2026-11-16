import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'How do I open the locker?',
    a: 'After booking, go to "My QR" in the app. You can open the locker by scanning the QR code at the locker panel, or by typing the 6-digit PIN on the keypad. You can also tap "Open locker" in the app to unlock it remotely.',
  },
  {
    q: 'What happens when my time is up?',
    a: "You'll receive a push notification 10 minutes before your time expires. You can extend by 1 hour at any time by tapping \"Extend +1 hr\" in the My Locker screen. There are no sudden fines — the reminder system gives you time to act.",
  },
  {
    q: 'How do I check locker availability?',
    a: 'Open the Titipin app and go to "Nearby Lockers." You\'ll see real-time availability for each hub, including the number of S, M, and L lockers currently free. The map on the Home screen also shows live counts on each pin.',
  },
  {
    q: 'What fits in an L-size locker?',
    a: 'The L-size locker can fit a standard travel carrier bag (up to 60L / 70 cm height). It\'s designed for large travel backpacks, strollers, and sports equipment. Note: L lockers are always billed per hour and are not included in the Monthly Plan.',
  },
  {
    q: 'What does the Monthly Plan cover?',
    a: 'The Monthly Plan (Rp125.000/month) gives you unlimited hours every day at all Titipin hubs in Surabaya. It covers S and M size lockers. L-size lockers are billed at Rp3.000/hour even with an active plan.',
  },
]

export function FAQ() {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">FAQ</h1>
            <p className="text-green-200 text-xs mt-0.5">Frequently asked questions</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-2">
        {FAQ_ITEMS.map((item, i) => (
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
          <p className="text-sm text-green-800 font-medium mb-1">Still have questions?</p>
          <p className="text-xs text-green-700 mb-3">Our support team is available every day 07:00–22:00 WIB.</p>
          <button
            onClick={() => navigate('/live-chat')}
            className="text-sm font-semibold text-green-700 hover:text-green-800 underline-offset-2 hover:underline"
          >
            Chat with us →
          </button>
        </div>
      </div>
    </div>
  )
}
