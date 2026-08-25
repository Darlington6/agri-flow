import clsx from 'clsx'

export function ProgressBar({ value, tone = 'brand', className }: { value: number; tone?: 'brand' | 'warn' | 'risk'; className?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div
        className={clsx('h-full rounded-full transition-all', {
          'bg-brand-600': tone === 'brand',
          'bg-status-warn': tone === 'warn',
          'bg-status-risk': tone === 'risk',
        })}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
