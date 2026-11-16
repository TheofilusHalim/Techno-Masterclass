import { NavLink, useLocation } from 'react-router-dom'
import { Home, Package, QrCode, Receipt, User } from 'lucide-react'
import { useStore } from '../store/useStore'

export function BottomNav() {
  const location = useLocation()
  const unreadNotifications = useStore((s) => s.unreadNotifications)

  // Hide bottom nav on certain sub-pages
  const hideOn = ['/payment', '/success', '/hub-detail', '/notifications', '/faq', '/live-chat', '/chat-support']
  if (hideOn.some((p) => location.pathname.startsWith(p))) return null

  const navItem = (to: string, Icon: React.ElementType, label: string, badge?: number) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors relative
        ${isActive ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'}`
      }
    >
      <Icon size={22} />
      <span className="font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0.5 right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  )

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around px-2 pt-2 pb-3 relative">
        {navItem('/', Home, 'Home', unreadNotifications)}
        {navItem('/my-locker', Package, 'My Locker')}

        {/* Floating QR FAB */}
        <NavLink
          to="/my-qr"
          className="flex flex-col items-center -mt-5"
        >
          <span className="w-14 h-14 rounded-full bg-green-700 flex items-center justify-center shadow-lg shadow-green-700/40 hover:bg-green-800 transition-colors">
            <QrCode size={26} className="text-white" />
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 font-medium">QR</span>
        </NavLink>

        {navItem('/transactions', Receipt, 'Transactions')}
        {navItem('/account', User, 'Account')}
      </div>
    </nav>
  )
}
