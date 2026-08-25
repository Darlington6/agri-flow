import type { ReactNode } from 'react'
import clsx from 'clsx'
import type { RiskLevel } from '@/types'

type Tone = 'good' | 'warn' | 'risk' | 'info' | 'neutral'

const TONE_CLASSES: Record<Tone, string> = {
  good: 'bg-status-good-bg text-status-good',
  warn: 'bg-status-warn-bg text-status-warn',
  risk: 'bg-status-risk-bg text-status-risk',
  info: 'bg-status-info-bg text-status-info',
  neutral: 'bg-ink-100 text-ink-600',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const RISK_TONE: Record<RiskLevel, Tone> = { low: 'good', medium: 'warn', high: 'risk' }
const RISK_LABEL: Record<RiskLevel, string> = { low: 'Low risk', medium: 'Medium risk', high: 'High risk' }

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <Badge tone={RISK_TONE[level]} className={className}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', {
        'bg-status-good': level === 'low',
        'bg-status-warn': level === 'medium',
        'bg-status-risk': level === 'high',
      })} />
      {RISK_LABEL[level]}
    </Badge>
  )
}