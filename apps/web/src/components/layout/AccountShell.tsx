import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { LogoMark } from '@/components/brand/LogoMark'
import { DemoTag } from '@/components/ui'

const tab = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
    isActive ? 'bg-primary-50 text-primary-800' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
  )

/** The pages of a real account (home, account): logo, title, and a way between them. */
export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center bg-canvas px-4 py-10 sm:py-12">
      <div className="mb-8 flex w-full max-w-2xl flex-col items-center gap-3 text-center">
        <Link
          to="/home"
          aria-label="AgriFlow home"
          className="mb-1 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
        >
          <LogoMark className="h-12" />
        </Link>
        <nav aria-label="Your account" className="flex gap-1">
          <NavLink to="/home" className={tab}>
            Home
          </NavLink>
          <NavLink to="/account" className={tab}>
            Account
          </NavLink>
        </nav>
        <h1 className="font-display text-2xl font-semibold text-ink-900">{title}</h1>
        <DemoTag />
      </div>
      {children}
    </div>
  )
}
