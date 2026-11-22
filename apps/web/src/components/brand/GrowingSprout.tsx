import clsx from 'clsx'

/**
 * A seedling coming up out of the soil, drawn once when it appears: shown when
 * a sign-in link or code is on its way. Decorative, so hidden from screen
 * readers; the heading next to it says what happened. The animation lives in
 * index.css (sprout-*) and is skipped for people who ask for less motion.
 */
export function GrowingSprout({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      data-testid="growing-sprout"
      className={clsx('h-16 w-16 text-accent', className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="sprout-soil text-ink-400">
        <path d="M12 54c6-3 14-4.5 20-4.5S46 51 52 54" stroke="currentColor" strokeWidth="2.5" />
        <path d="M22 58h20" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      </g>
      <path className="sprout-stem" pathLength={1} d="M32 51c0-8-1-14 0-23" stroke="currentColor" strokeWidth="2.5" />
      <path
        className="sprout-leaf"
        style={{ transformOrigin: '32px 38px', animationDelay: '750ms' }}
        d="M32 38c-8 0-13.5-5-14-12 7 0 13 4.5 14 12Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        className="sprout-leaf"
        style={{ transformOrigin: '32px 30px', animationDelay: '950ms' }}
        d="M32 30c7.5-.5 12.5-5.5 13-13-7.5.5-12.5 5.5-13 13Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}
