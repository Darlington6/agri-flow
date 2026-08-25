import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
  hoverable?: boolean
  tone?: 'default' | 'dark'
}

const TONE_CLASSES: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'bg-white border-ink-100',
  dark: 'bg-brand-950 border-brand-900 text-white',
}

export function Card({ children, className, padded = true, hoverable = false, tone = 'default', ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border shadow-[var(--shadow-card)]',
        TONE_CLASSES[tone],
        hoverable && 'transition-shadow hover:shadow-[var(--shadow-card-hover)]',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
