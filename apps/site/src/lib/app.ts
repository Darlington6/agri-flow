/**
 * Links into the AgriFlow app (today apps/web; later the PWA at app.<domain>).
 * Set PUBLIC_APP_URL to its address. Unset in a production build, the
 * "Log in" / "Create account" links are left out rather than pointing
 * nowhere; in local development they default to the web app's dev server.
 *
 * Signing in with a new phone number or email creates the account, so both
 * links go to the sign-in page for now.
 */
export function appUrl(path: string, env: { PUBLIC_APP_URL?: string; DEV?: boolean } = import.meta.env): string | undefined {
  const base = env.PUBLIC_APP_URL || (env.DEV ? 'http://localhost:5173' : undefined)
  return base ? new URL(path, base).href : undefined
}

export const signInUrl = () => appUrl('/signin')
export const createAccountUrl = () => appUrl('/signin')
