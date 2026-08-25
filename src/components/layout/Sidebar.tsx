import { NavLink } from 'react-router-dom'
import { Leaf, HelpCircle } from 'lucide-react'
import clsx from 'clsx'
import { brand } from '@/config/brand'
import { navForRole, secondaryNav } from './navigation'
import { ComingSoonBadge } from '@/components/ui'
import { useSession } from '@/context/SessionContext'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useSession()
  const primaryNav = navForRole(session?.role ?? 'Platform Admin')

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-ink-100 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
          <Leaf className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold leading-tight text-ink-900">{brand.name}</p>
          <p className="text-[11px] leading-tight text-ink-400">{brand.country} pilot</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        <ul className="flex flex-col gap-0.5">
          {primaryNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="my-3 h-px bg-ink-100" />

        <ul className="flex flex-col gap-0.5">
          {secondaryNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <div className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-400">
              <HelpCircle className="h-[18px] w-[18px]" />
              Help
              <ComingSoonBadge className="ml-auto" />
            </div>
          </li>
        </ul>
      </nav>

      <div className="border-t border-ink-100 px-5 py-4">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-status-good" />
          Pilot Simulation
        </div>
      </div>
    </div>
  )
}
