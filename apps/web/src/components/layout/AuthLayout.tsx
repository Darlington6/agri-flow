import { useState, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'
import type { AppPhoto } from '@agriflow/media'
import { appSlides } from '@/lib/appPhotos'
import { Backdrop } from '@/components/brand/Backdrop'

/** Seconds each photo gets (the site's home page uses 7). */
const SLIDE_SECONDS = 5

/** Only the first photo, still: for less motion, or a connection in data-saving mode. */
function stillOnly(): boolean {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ?? false
  return reduce || saveData
}

/**
 * The entry pages (sign-in, demo roles): photos beside the content. On wide
 * screens they fill the left half and stay put while the content scrolls; on
 * phones and tablets they're a short band across the top, so the form is
 * still on the first screen.
 *
 * The photos crossfade with a slow pan and zoom, like the site's home page.
 * The first loads straight away; the others only once it has, and the
 * crossfade starts only when they're all in, so it never fades to an empty
 * frame. People who ask for less motion, or save data, get the first photo, still.
 */
export function AuthLayout({ photo, children }: { photo: AppPhoto; children: ReactNode }) {
  const slides = appSlides(photo)
  const [still] = useState(stillOnly)
  const [firstLoaded, setFirstLoaded] = useState(false)
  const [loaded, setLoaded] = useState(1)
  const shown = still || !firstLoaded ? slides.slice(0, 1) : slides
  const playing = shown.length > 1 && loaded >= shown.length
  const cycle = shown.length * SLIDE_SECONDS

  return (
    <div className="min-h-svh bg-canvas lg:grid lg:grid-cols-2">
      {/* Decorative: the page's heading carries the meaning. */}
      {/* Above the page's fixed backdrop, so the glow never tints the photos. */}
      <div aria-hidden className="relative z-10 h-36 overflow-hidden sm:h-52 lg:sticky lg:top-0 lg:h-svh">
        {shown.map(({ src, srcSet, focus }, i) => (
          <img
            key={src}
            src={src}
            srcSet={srcSet}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt=""
            fetchPriority={i === 0 ? 'high' : 'low'}
            decoding="async"
            onLoad={() => (i === 0 ? setFirstLoaded(true) : setLoaded((n) => n + 1))}
            className={clsx(
              'absolute inset-0 h-full w-full scale-[1.02] object-cover dark:brightness-90',
              playing && 'auth-slide',
              !playing && i > 0 && 'opacity-0',
            )}
            style={
              {
                objectPosition: focus,
                zIndex: shown.length - i,
                '--cycle': `${cycle}s`,
                animationDelay: i === 0 ? '0s' : `${-(cycle - i * SLIDE_SECONDS)}s`,
              } as CSSProperties
            }
          />
        ))}
        {/* A soft fade into the page on phones, so the band doesn't end in a hard line. */}
        <div className="absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-canvas to-transparent lg:hidden" />
      </div>
      <main className="relative flex flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-12 sm:px-6 lg:min-h-svh lg:py-12">
        {/* Fixed to the content's half of the window on wide screens, beside the photos. */}
        <Backdrop className="lg:left-1/2" />
        <div className="relative flex w-full flex-col items-center">{children}</div>
      </main>
    </div>
  )
}
