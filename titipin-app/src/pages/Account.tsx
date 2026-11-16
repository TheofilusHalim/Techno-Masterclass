import { useNavigate } from 'react-router-dom'
import { Bell, MessageSquare, HelpCircle, Globe, LogOut, ChevronRight, Crown } from 'lucide-react'
import { useStore } from '../store/useStore'

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

export function Account() {
  const navigate = useNavigate()
  const { userName, hasMonthlyPlan, subscribeMonthly } = useStore()

  const menuItems = [
    { icon: Bell, label: 'Notifications', action: () => navigate('/notifications') },
    { icon: MessageSquare, label: 'Live chat', action: () => navigate('/live-chat') },
    { icon: HelpCircle, label: 'FAQ', action: () => navigate('/faq') },
    { icon: Globe, label: 'Language', action: () => {} },
    { icon: LogOut, label: 'Log out', action: () => {}, danger: true },
  ]

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {userName.charAt(0)}
          </div>
          <div>
            <p className="text-white text-xl font-bold">{userName}</p>
            <p className="text-green-200 text-sm">kevin@example.com</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Monthly Plan card */}
        <div className={`rounded-2xl p-4 border ${
          hasMonthlyPlan
            ? 'bg-gradient-to-br from-green-700 to-green-800 border-green-600'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Crown size={16} className={hasMonthlyPlan ? 'text-yellow-300' : 'text-gray-400'} />
                <p className={`text-sm font-semibold ${hasMonthlyPlan ? 'text-white' : 'text-gray-700'}`}>
                  Monthly Plan
                </p>
              </div>
              <p className={`text-xs ${hasMonthlyPlan ? 'text-green-200' : 'text-gray-400'}`}>
                {hasMonthlyPlan
                  ? 'Unlimited access — all hubs, S & M lockers'
                  : 'Unlimited hours at all hubs — Rp125.000/month'}
              </p>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              hasMonthlyPlan
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {hasMonthlyPlan ? 'Active' : 'Not active'}
            </span>
          </div>
          {!hasMonthlyPlan && (
            <button
              onClick={subscribeMonthly}
              className="w-full py-2.5 bg-green-700 text-white rounded-xl font-semibold text-sm hover:bg-green-800 transition-colors"
            >
              Subscribe — {formatIDR(125000)}/month
            </button>
          )}
          {hasMonthlyPlan && (
            <p className={`text-xs ${hasMonthlyPlan ? 'text-green-300' : 'text-gray-400'}`}>
              Renews on 15 Dec 2026
            </p>
          )}
        </div>

        {/* Menu items */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
          {menuItems.map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              onClick={action}
              className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                danger ? 'text-red-500' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={danger ? 'text-red-400' : 'text-gray-400'} />
                <span className="text-sm font-medium">{label}</span>
              </div>
              {!danger && <ChevronRight size={16} className="text-gray-300" />}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 pb-2">Titipin v1.0.0 • Made with ❤️ in Surabaya</p>
      </div>
    </div>
  )
}
