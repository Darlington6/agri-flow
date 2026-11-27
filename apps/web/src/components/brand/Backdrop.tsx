import clsx from 'clsx'
import { LogoMark } from './LogoMark'

/**
 * The AgriFlow mark behind a page's content, as in the Expo app: the
 * website's illuminated logo (glow, ring, gold sun, sage circle) from the
 * top-left corner, and the plain mark, large and faint, cut off at the
 * bottom-right. Decorative.
 *
 * The strengths are the Expo app's (apps/app/src/components/logo-glow.tsx),
 * whose test checks that text over them keeps 4.5:1 on the same cream and
 * dark canvases: grey text outside the ring, text and links over it.
 *
 * It stays put while the page scrolls, as in the Expo app: fixed to the
 * window (`className` narrows it, e.g. to the content half beside photos).
 * Put it first in the page, with the content after it `relative`, so the
 * content stays above.
 */
export function Backdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx('pointer-events-none fixed inset-0 overflow-hidden', className)}>
      {/* The glow, its sun just inside the top-left corner (proportions from the site's LogoGlow). */}
      <div className="absolute top-[calc(min(80vmax,760px)*-0.36)] left-[calc(min(80vmax,760px)*-0.36)] size-[min(80vmax,760px)]">
        <div className="absolute top-[1.11%] left-[2.78%] size-[94.44%] rounded-full bg-[radial-gradient(circle_closest-side,#d1bf98,rgb(209_191_152/0))] opacity-40 dark:opacity-[0.15]" />
        <div className="absolute top-[24.44%] left-[26.11%] size-[47.78%] rounded-full bg-[#283f2f] opacity-[0.02] dark:bg-[#f5f1e6] dark:opacity-[0.04]" />
        <div className="absolute top-[33.89%] left-[33.89%] size-[32.22%] rounded-full bg-[#b2934d] opacity-[0.035] dark:opacity-[0.1]" />
        <div className="absolute top-[60%] left-[32.22%] size-[16.67%] rounded-full bg-[#93a281] opacity-[0.03] dark:opacity-[0.07]" />
      </div>
      {/* The plain mark, faint, cut off at the bottom-right. */}
      <div className="absolute right-[calc(min(75vmax,720px)*-0.3)] bottom-[calc(min(75vmax,720px)*-0.25)] flex size-[min(75vmax,720px)] justify-center opacity-5">
        <LogoMark className="h-full" />
      </div>
    </div>
  )
}
