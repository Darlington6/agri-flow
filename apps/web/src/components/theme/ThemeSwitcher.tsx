import { useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import clsx from 'clsx'
import { getThemeMode, setThemeMode, type ThemeMode } from '@/lib/theme'

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'system', label: 'System', icon: Monitor },
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
]

/** System / Light / Dark. "System" follows the device setting. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>(getThemeMode)

  function choose(next: ThemeMode) {
    setThemeMode(next)
    setMode(next)
  }

  return (
    <div role="radiogroup" aria-label="Theme" className={clsx('inline-flex rounded-full bg-ink-100 p-1', className)}>
      {OPTIONS.map(({ mode: option, label, icon: Icon }) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={mode === option}
          onClick={() => choose(option)}
          className={clsx(
            'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
            mode === option ? 'bg-surface text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-800',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}
