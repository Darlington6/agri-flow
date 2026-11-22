import clsx from 'clsx'

/**
 * Shown while a page's file downloads (usually a moment). It waits half a
 * second before appearing, so fast connections never see it flash.
 */
export function PageLoading({ fullScreen }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      // The same fade as elsewhere, held back half a second (and hidden until then).
      style={{ animation: 'var(--animate-fade-in) 500ms both' }}
      className={clsx(
        'flex items-center justify-center motion-reduce:[animation:none]',
        fullScreen ? 'min-h-svh bg-canvas' : 'min-h-64',
      )}
    >
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-accent motion-reduce:animate-none" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
