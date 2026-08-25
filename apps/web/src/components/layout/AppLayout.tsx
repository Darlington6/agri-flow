import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { canAccess } from '@/lib/permissions'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { session } = useSession()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (!session) return <Navigate to="/login" replace />

  if (!canAccess(session.role, location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex h-svh bg-ink-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-[-44px] top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-600 shadow"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
