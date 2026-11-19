import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { checkForAppUpdate, type AppVersionInfo } from '../lib/versionService'
import { requestNotificationPermission } from '../lib/notificationService'
import { AppUpdateModal } from './AppUpdateModal'

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [availableUpdate, setAvailableUpdate] = useState<AppVersionInfo | null>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  useEffect(() => {
    // Request native Android notification permission & initialize channel
    requestNotificationPermission().catch(console.warn)

    // Check for new app updates in Supabase
    checkForAppUpdate().then((update) => {
      if (update) {
        setAvailableUpdate(update)
        setIsUpdateModalOpen(true)
      }
    })
  }, [])

  useEffect(() => {
    // Check current session from Supabase on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const displayName =
          session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        useStore.setState({
          isAuthenticated: true,
          userId: session.user.id,
          userEmail: session.user.email || '',
          userName: displayName,
        })
        useStore.getState().refreshUserProfile(session.user.id)
        useStore.getState().loadActiveBooking(session.user.id)
      } else {
        useStore.setState({
          isAuthenticated: false,
          userId: null,
          userEmail: '',
          userName: '',
          hasActiveLocker: false,
          activeBookingId: null,
          activeBooking: null,
        })
        // If not authenticated and not already on /auth or /login, redirect to /auth
        if (location.pathname !== '/auth' && location.pathname !== '/login' && location.pathname !== '/faq') {
          navigate('/auth', { replace: true })
        }
      }
      setIsCheckingAuth(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const displayName =
          session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        useStore.setState({
          isAuthenticated: true,
          userId: session.user.id,
          userEmail: session.user.email || '',
          userName: displayName,
        })
        useStore.getState().refreshUserProfile(session.user.id)
        useStore.getState().loadActiveBooking(session.user.id)
      } else {
        useStore.setState({
          isAuthenticated: false,
          userId: null,
          userEmail: '',
          userName: '',
          hasActiveLocker: false,
          activeBookingId: null,
          activeBooking: null,
        })
        if (location.pathname !== '/auth' && location.pathname !== '/login' && location.pathname !== '/faq') {
          navigate('/auth', { replace: true })
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isFullScreenPage = ['/chat-support'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {/* Mobile viewport */}
      <div className="relative w-full max-w-md bg-white min-h-screen flex flex-col shadow-xl">
        {/* Page content */}
        <main className={`flex-1 flex flex-col ${isFullScreenPage ? 'overflow-hidden h-screen max-h-screen' : 'overflow-y-auto pb-20'}`}>
          <Outlet />
        </main>
        <BottomNav />

        {/* In-App Update Modal Prompt */}
        {availableUpdate && (
          <AppUpdateModal
            updateInfo={availableUpdate}
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
