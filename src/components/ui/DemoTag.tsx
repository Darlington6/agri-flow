import { Circle } from 'lucide-react'
import { brand } from '@/config/brand'

export function DemoTag({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-earth-100 px-2.5 py-1 text-xs font-medium text-earth-700 ${className ?? ''}`}>
      <Circle className="h-2 w-2 fill-current" />
      {brand.environmentLabel}
    </span>
  )
}

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-500 ${className ?? ''}`}>
      Coming soon
    </span>
  )
}
