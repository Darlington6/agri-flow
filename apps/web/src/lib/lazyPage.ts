import { lazy, type ComponentType } from 'react'

/** A page loaded on first visit, from a module that exports it by name. */
export function page<M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M & string) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType }))
}

const RELOADED_AT = 'agriflow.reloadedForUpdate'

/**
 * After a new release, an open tab may ask for a page file that no longer
 * exists. Reload to pick up the new release instead of showing an error. If
 * it happens again within a minute, the problem is something else: let the
 * error show rather than reload in a loop.
 */
export function reloadOnStaleRelease() {
  window.addEventListener('vite:preloadError', (event) => {
    try {
      const last = Number(sessionStorage.getItem(RELOADED_AT))
      if (last && Date.now() - last < 60_000) return
      sessionStorage.setItem(RELOADED_AT, String(Date.now()))
    } catch {
      return // No storage: can't guard against a loop, so don't reload.
    }
    event.preventDefault()
    window.location.reload()
  })
}
