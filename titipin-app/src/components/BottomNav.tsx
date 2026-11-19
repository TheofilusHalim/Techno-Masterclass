import { NavLink, useLocation } from 'react-router-dom'
import { Home, Package, QrCode, Receipt, User } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useTranslation } from '../utils/i18n'

export function BottomNav() {
  const location = useLocation()
  const unreadNotifications = useStore((s) => s.unreadNotifications)
  const { t } = useTranslation()

  // Hide bottom nav on certain sub-pages and auth screens
  const hideOn = ['/auth', '/login', '/payment', '/success', '/hub-detail', '/notifications', '/faq', '/live-chat', '/chat-support']
  if (hideOn.some((p) => location.pathname.startsWith(p))) return null

  const navItem = (to: string, Icon: React.ElementType, label: string, badge?: number) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-xs transition-colors relative w-full
        ${isActive ? 'text-green-700 font-bold' : 'text-gray-400 hover:text-gray-600'}`
      }
    >
      <Icon size={22} />
      <span className="font-medium text-[11px] truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0.5 right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  )

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="grid grid-cols-5 items-center px-2 pt-2 pb-3 relative">
        {navItem('/', Home, t('navHome'), unreadNotifications)}
        {navItem('/my-locker', Package, t('navLocker'))}

        {/* Floating QR FAB */}
        <NavLink
          to="/my-qr"
          className="flex flex-col items-center justify-center -mt-5"
        >
          <span className="w-14 h-14 rounded-full bg-green-700 flex items-center justify-center shadow-lg shadow-green-700/40 hover:bg-green-800 transition-colors">
            <QrCode size={26} className="text-white" />
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 font-medium">{t('navScan')}</span>
        </NavLink>

        {navItem('/transactions', Receipt, t('navTransactions'))}
        {navItem('/account', User, t('navAccount'))}
      </div>
    </nav>
  )
}
