import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, CalendarClock, CreditCard, Lock, MessageSquare } from 'lucide-react'

const TOPICS = [
  { key: 'booking', label: 'Booking issue', desc: "Can't complete or modify a booking", icon: CalendarClock },
  { key: 'payment', label: 'Payment issue', desc: 'Payment failed or not confirmed', icon: CreditCard },
  { key: 'locker', label: 'Locker problem', desc: 'Will not open or is damaged', icon: Lock },
  { key: 'other', label: 'Other', desc: 'Something else not listed above', icon: MessageSquare },
]

export function LiveChatTopics() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Live Chat</h1>
            <p className="text-green-200 text-xs mt-0.5">We typically reply in under 2 minutes</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">What can we help you with?</p>
        <div className="space-y-3">
          {TOPICS.map(({ key, label, desc, icon: TopicIcon }) => (
            <button
              key={key}
              onClick={() => navigate('/chat-support', { state: { topic: label } })}
              className="w-full flex items-center gap-3.5 p-4 bg-white border border-gray-200 rounded-2xl hover:border-green-300 hover:shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <TopicIcon size={19} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Operating hours */}
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-1">Support Hours</p>
          <p className="text-xs text-gray-500">Daily: 07:00 – 22:00 WIB</p>
          <p className="text-xs text-gray-400 mt-1">For emergencies (locker stuck), we respond 24/7.</p>
        </div>
      </div>
    </div>
  )
}
