/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The API's address, e.g. https://agriflow-api-rp79.onrender.com. Checked at build time. */
  readonly VITE_API_URL?: string
  /** The public site (terms, privacy). Defaults to the production site. */
  readonly VITE_SITE_URL?: string
  /** The Google OAuth client ID for "Continue with Google". Defaults to AgriFlow's web client. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
  /** Sentry project DSN (agriflow-web). Unset = no error reports. */
  readonly VITE_SENTRY_DSN?: string
  /** production | preview | development, from Vercel's VERCEL_ENV (see vite.config.ts). */
  readonly VITE_DEPLOY_ENV: string
  /** The commit being served, from Vercel (see vite.config.ts). */
  readonly VITE_RELEASE: string
}
