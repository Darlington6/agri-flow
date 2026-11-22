import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

/**
 * A card you choose by clicking or tapping, e.g. "pick a role". It's a real
 * <button>, so it works with a keyboard (Tab, then Enter or Space) and is
 * announced by screen readers, unlike a <div> with an onClick.
 *
 * Buttons may only contain inline content: use <span>s (styled as blocks)
 * inside, not <p> or <div>.
 */
export function CardButton({
  children,
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type={type}
      className={clsx(
        'flex w-full flex-col justify-start rounded-2xl border border-ink-100 bg-surface p-5 text-left shadow-[var(--shadow-card)] sm:p-6',
        'transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
