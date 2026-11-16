import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Home } from './pages/Home'
import { NearbyLockers } from './pages/NearbyLockers'
import { HubDetail } from './pages/HubDetail'
import { Payment } from './pages/Payment'
import { Success } from './pages/Success'
import { MyQR } from './pages/MyQR'
import { MyLocker } from './pages/MyLocker'
import { Transactions } from './pages/Transactions'
import { Account } from './pages/Account'
import { Notifications } from './pages/Notifications'
import { FAQ } from './pages/FAQ'
import { LiveChatTopics } from './pages/LiveChatTopics'
import { ChatSupport } from './pages/ChatSupport'
import { Auth } from './pages/Auth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'auth', element: <Auth /> },
      { path: 'login', element: <Auth /> },
      { path: 'nearby-lockers', element: <NearbyLockers /> },
      { path: 'hub-detail', element: <HubDetail /> },
      { path: 'payment', element: <Payment /> },
      { path: 'success', element: <Success /> },
      { path: 'my-qr', element: <MyQR /> },
      { path: 'my-locker', element: <MyLocker /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'account', element: <Account /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'faq', element: <FAQ /> },
      { path: 'live-chat', element: <LiveChatTopics /> },
      { path: 'chat-support', element: <ChatSupport /> },
    ],
  },
])
