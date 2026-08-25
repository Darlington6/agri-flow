import type { ComponentType } from 'react'
import clsx from 'clsx'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon?: ComponentType<{ className?: string }>
  tone?: 'default' | 'risk'
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-ink-500">{label}</span>
        {Icon && (
          <span
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              tone === 'risk' ? 'bg-status-risk-bg text-status-risk' : 'bg-brand-50 text-brand-700',
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <div className={clsx('font-display text-3xl font-semibold', tone === 'risk' ? 'text-status-risk' : 'text-ink-900')}>
        {value}
      </div>
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
    </Card>
  )
}