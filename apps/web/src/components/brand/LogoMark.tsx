import clsx from 'clsx'
import markUrl from '@agriflow/design-tokens/assets/logos/agriflow-mark.svg'
import markReversedUrl from '@agriflow/design-tokens/assets/logos/agriflow-mark-reversed.svg'
import { brand } from '@/config/brand'

type LogoMarkProps = {
  /** Size with a height utility (e.g. `h-9`); width follows the mark's aspect ratio. */
  className?: string
  /** `reversed` swaps the forest ring for cream, for dark backgrounds. */
  variant?: 'color' | 'reversed'
  /**
   * Decorative by default, because the mark almost always sits next to the
   * visible brand name. Pass `false` when it stands alone, so it is announced.
   */
  decorative?: boolean
}

/** The AgriFlow mark. Source of truth: packages/design-tokens/assets/logos. */
export function LogoMark({ className, variant = 'color', decorative = true }: LogoMarkProps) {
  return (
    <img
      src={variant === 'reversed' ? markReversedUrl : markUrl}
      alt={decorative ? '' : brand.name}
      aria-hidden={decorative || undefined}
      draggable={false}
      className={clsx('w-auto shrink-0 select-none', className)}
    />
  )
}
