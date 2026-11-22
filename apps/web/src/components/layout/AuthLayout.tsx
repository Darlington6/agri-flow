import type { ReactNode } from 'react'
import type { AppPhoto } from '@agriflow/media'
import { appPhoto } from '@/lib/appPhotos'

/**
 * The entry pages (sign-in, demo roles): a photo beside the content. On wide
 * screens the photo fills the left half and stays put while the content
 * scrolls; on phones and tablets it's a short band across the top, so the
 * form is still on the first screen.
 */
export function AuthLayout({ photo, children }: { photo: AppPhoto; children: ReactNode }) {
  const { src, srcSet, focus } = appPhoto(photo)
  return (
    <div className="min-h-svh bg-canvas lg:grid lg:grid-cols-2">
      <div className="relative h-36 overflow-hidden sm:h-52 lg:sticky lg:top-0 lg:h-svh">
        {/* Decorative: the page's heading carries the meaning. */}
        <img
          src={src}
          srcSet={srcSet}
          sizes="(min-width: 1024px) 50vw, 100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-90"
          style={focus ? { objectPosition: focus } : undefined}
        />
        {/* A soft fade into the page on phones, so the band doesn't end in a hard line. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-canvas to-transparent lg:hidden"
        />
      </div>
      <main className="flex flex-col items-center justify-center px-4 pt-6 pb-12 sm:px-6 lg:min-h-svh lg:py-12">
        {children}
      </main>
    </div>
  )
}
