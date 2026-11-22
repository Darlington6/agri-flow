import clsx from 'clsx'
import markUrl from '@agriflow/design-tokens/assets/logos/agriflow-mark.svg'
import markReversedUrl from '@agriflow/design-tokens/assets/logos/agriflow-mark-reversed.svg'
import { brand } from '@/config/brand'

type LogoMarkProps = {
  /** Size with a height utility (e.g. `h-9`); width follows the mark's aspect ratio. */
  className?: string
  /**
   * `color` (default) follows the theme: forest ring in light mode, cream in
   * dark. `reversed` is always cream, for dark surfaces in either theme.
   */
  variant?: 'color' | 'reversed'
  /**
   * Decorative by default, because the mark almost always sits next to the
   * visible brand name. Pass `false` when it stands alone, so it is announced.
   */
  decorative?: boolean
}

/** The AgriFlow mark. Source of truth: packages/design-tokens/assets/logos. */
export function LogoMark({ className, variant = 'color', decorative = true }: LogoMarkProps) {
  const props = {
    alt: decorative ? '' : brand.name,
    'aria-hidden': decorative || undefined,
    draggable: false,
  }
  const classes = clsx('w-auto shrink-0 select-none', className)
  if (variant === 'reversed') return <img src={markReversedUrl} {...props} className={classes} />
  return (
    <>
      <img src={markUrl} {...props} className={clsx(classes, 'dark:hidden')} />
      {/* The dark-theme copy is always hidden from screen readers, so the name isn't read twice. */}
      <img src={markReversedUrl} alt="" aria-hidden draggable={false} className={clsx(classes, 'hidden dark:block')} />
    </>
  )
}
