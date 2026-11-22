import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse' | 'ghost-inverse'
export type ButtonSize = 'sm' | 'md'

// Each variant is a fully self-contained class string (not a base + override)
// so Tailwind's internal utility ordering can never make one color property
// "win" over another when a caller wants a different look — e.g. a button
// placed on a dark card needs `inverse`/`ghost-inverse`, not `primary` plus
// a className color override.
// The public site's buttons: pills in the logo's forest green with cream
// text, gold on dark surfaces. Teal stays for links and focus rings.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-800 text-cream hover:bg-brand-700 focus-visible:ring-primary-500',
  secondary: 'bg-brand-100 text-brand-800 hover:bg-brand-50 focus-visible:ring-primary-500',
  outline:
    'border border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50 focus-visible:ring-primary-500',
  ghost: 'text-ink-600 hover:bg-ink-100 focus-visible:ring-primary-500',
  inverse: 'bg-gold-400 text-brand-950 hover:bg-gold-300 focus-visible:ring-white/60',
  'ghost-inverse': 'border border-cream/40 text-cream hover:bg-white/10 focus-visible:ring-white/60',
}

// md is 44px tall: a comfortable tap target on phones.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-sm',
}

/** The button look, for a link that should look like a button (e.g. a router `<Link>`). */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  )
}
