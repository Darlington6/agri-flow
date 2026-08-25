import { useState, useRef, useEffect, useMemo } from 'react'
import { Menu, Bell, ChevronDown, LogOut } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { scopedNotifications } from '@/lib/scope'
import { DemoTag } from '@/components/ui'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { session, logout } = useSession()
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const unread = useMemo(() => scopedNotifications(session).filter((n) => !n.read), [session])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-100 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-ink-500 hover:bg-ink-50 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <DemoTag className="hidden sm:inline-flex" />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-50"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-status-risk" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-ink-100 bg-white p-2 shadow-[var(--shadow-card-hover)]">
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                Risk alerts &amp; notifications
              </p>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {unread.map((n) => (
                  <div key={n.id} className="rounded-xl px-2 py-2 hover:bg-ink-50">
                    <p className="text-sm font-medium text-ink-800">{n.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{n.message}</p>
                  </div>
                ))}
                {unread.length === 0 && (
                  <p className="px-2 py-3 text-sm text-ink-400">No alerts for you right now.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-ink-100 py-1.5 pl-1.5 pr-2.5 hover:bg-ink-50"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-xs font-semibold text-white">
              {session?.name?.[0] ?? 'A'}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink-800">{session?.name}</span>
              <span className="block text-[11px] leading-tight text-ink-400">{session?.role}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-[var(--shadow-card-hover)]">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-ink-600 hover:bg-ink-50"
              >
                <LogOut className="h-4 w-4" />
                Switch role
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}