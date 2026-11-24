import { Suspense, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { canAccess } from '@/lib/permissions'
import { hasSeenTour, markTourSeen } from '@/lib/demoTour'
import { DemoTour } from './DemoTour'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { PageLoading } from './PageLoading'

export function AppLayout() {
  const { session } = useSession()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // The tour opens by itself the first time each role is explored on this device.
  // (Switching role goes back to /login, so this starts afresh for the next role.)
  const [tourOpen, setTourOpen] = useState(() => (session ? !hasSeenTour(session.role) : false))

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
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-4 right-[-44px] flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-600 shadow"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} onTourClick={() => setTourOpen(true)} />
        <main className="flex-1 scrollbar-thin overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
            {/* The sidebar and top bar stay while the next page downloads. */}
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {tourOpen && (
        <DemoTour
          onClose={() => {
            markTourSeen(session.role)
            setTourOpen(false)
          }}
        />
      )}
    </div>
  )
}
