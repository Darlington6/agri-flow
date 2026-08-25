import type { ComponentType, ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-400 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div>
        <p className="font-medium text-ink-800">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}