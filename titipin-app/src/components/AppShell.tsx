import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SimulatorPanel } from './SimulatorPanel'

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {/* Mobile viewport */}
      <div className="relative w-full max-w-sm bg-white min-h-screen flex flex-col shadow-xl">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </main>
        <BottomNav />
      </div>

      {/* Desktop Hardware Simulator Panel — only visible md+ */}
      <div className="hidden md:flex md:flex-col md:w-80 md:ml-4 md:self-start md:sticky md:top-4">
        <SimulatorPanel />
      </div>
    </div>
  )
}
