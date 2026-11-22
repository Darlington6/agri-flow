import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse' | 'ghost-inverse'
export type ButtonSize = 'sm' | 'md'

// Each variant is a fully self-contained class string (not a base + override)
// so Tailwind's internal utility ordering can never make one color property
// "win" over another when a caller wants a different look — e.g. a button
// placed on a dark card needs `inverse`/`ghost-inverse`, not `primary` plus
// a className color override.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-primary-50 text-primary-800 hover:bg-primary-100 focus-visible:ring-primary-500',
  outline: 'border border-ink-200 text-ink-700 hover:bg-ink-50 focus-visible:ring-primary-500',
  ghost: 'text-ink-600 hover:bg-ink-100 focus-visible:ring-primary-500',
  inverse: 'bg-white text-primary-800 hover:bg-primary-50 focus-visible:ring-white/50',
  'ghost-inverse': 'text-white hover:bg-white/10 focus-visible:ring-white/50',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
}

/** The button look, for a link that should look like a button (e.g. a router `<Link>`). */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  )
}
