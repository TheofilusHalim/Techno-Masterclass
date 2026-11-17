import { useNavigate } from 'react-router-dom'
import { Bell, MessageSquare, HelpCircle, Globe, LogOut, ChevronRight, Crown, LogIn, Shield, User, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store/useStore'

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

export function Account() {
  const navigate = useNavigate()
  const { userName, userEmail, isAuthenticated, hasMonthlyPlan, subscribeMonthly, logoutUser } = useStore()

  const handleLogout = async () => {
    await logoutUser()
    navigate('/auth')
  }

  const menuItems = [
    { icon: Bell, label: 'Notifications', action: () => navigate('/notifications') },
    { icon: MessageSquare, label: 'Live chat', action: () => navigate('/live-chat') },
    { icon: HelpCircle, label: 'FAQ', action: () => navigate('/faq') },
    { icon: Globe, label: 'Language', action: () => {} },
    ...(isAuthenticated
      ? [{ icon: LogOut, label: 'Log out', action: handleLogout, danger: true }]
      : [{ icon: LogIn, label: 'Sign In / Register', action: () => navigate('/auth'), highlight: true }]),
  ]

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-8">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-green-300">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white text-xl font-bold">{userName}</p>
                <span className="bg-green-600 text-green-100 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Shield size={10} /> Verified
                </span>
              </div>
              <p className="text-green-200 text-sm mt-0.5">{userEmail}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-full bg-green-800 text-green-200 flex items-center justify-center mx-auto mb-3">
              <User size={30} />
            </div>
            <h2 className="text-white text-lg font-bold">You are not signed in</h2>
            <p className="text-green-200 text-xs mt-1 mb-4">
              Sign in to manage your bookings and unlock smart lockers
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2.5 bg-white text-green-800 rounded-xl text-xs font-bold shadow-md hover:bg-green-50 transition-all active:scale-95"
            >
              Sign In / Register
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Monthly Subscription Membership Pass Card */}
        <div className={`rounded-2xl p-4 border transition-all ${
          hasMonthlyPlan
            ? 'bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 border-green-600 text-white shadow-md'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Crown size={18} className={hasMonthlyPlan ? 'text-amber-300' : 'text-gray-400'} />
                <p className={`text-sm font-bold ${hasMonthlyPlan ? 'text-white' : 'text-gray-800'}`}>
                  {hasMonthlyPlan ? 'Paket Aktif (Member VIP)' : 'Langganan Member Bulanan'}
                </p>
              </div>
              <p className={`text-xs ${hasMonthlyPlan ? 'text-green-100' : 'text-gray-500'}`}>
                {hasMonthlyPlan
                  ? 'Akses loker Size S & M tanpa batas kuota di seluruh hub.'
                  : 'Sewa loker harian tanpa batas biaya di semua hub.'}
              </p>
            </div>
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap ${
              hasMonthlyPlan
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {hasMonthlyPlan ? 'Member VIP Aktif' : 'Belum Berlangganan'}
            </span>
          </div>

          {!hasMonthlyPlan ? (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Cukup {formatIDR(125000)}/bulan untuk akses loker S dan M setiap hari bebas biaya jam sewa.
              </p>
              <button
                onClick={subscribeMonthly}
                className="w-full py-3 bg-green-700 text-white rounded-xl font-bold text-xs hover:bg-green-800 active:scale-95 transition-all shadow-sm"
              >
                Berlangganan Sekarang — {formatIDR(125000)}/bulan
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-green-600/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-green-100">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} className="text-amber-300" />
                  Status Keanggotaan: <strong>Aktif</strong>
                </span>
                <span className="text-[11px] bg-black/20 text-green-200 px-2 py-0.5 rounded-md font-mono">
                  1 Akun / 30 Hari
                </span>
              </div>
              <p className="text-[11px] text-green-200">
                Berlaku hingga: <strong>17 Desember 2026</strong>. Anda tidak dapat berlangganan ganda selama paket aktif.
              </p>
            </div>
          )}
        </div>

        {/* Menu items */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-xs">
          {menuItems.map(({ icon: Icon, label, action, danger, highlight }: any) => (
            <button
              key={label}
              onClick={action}
              className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                danger
                  ? 'text-red-500'
                  : highlight
                  ? 'text-green-700 font-bold bg-green-50/50'
                  : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={danger ? 'text-red-400' : highlight ? 'text-green-600' : 'text-gray-400'} />
                <span className="text-sm font-medium">{label}</span>
              </div>
              {!danger && <ChevronRight size={16} className={highlight ? 'text-green-600' : 'text-gray-300'} />}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 pb-2">Titipin v1.0.0 • Connected to Supabase Auth</p>
      </div>
    </div>
  )
}
