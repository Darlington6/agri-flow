interface ImportMetaEnv {
  /** Base URL of the AgriFlow API, e.g. https://agriflow-api.vercel.app. Used by the demo request form. */
  readonly PUBLIC_API_URL?: string
  /** Address of the AgriFlow app (web app today, the PWA later), for "Log in" / "Create account". */
  readonly PUBLIC_APP_URL?: string
  /** "true" lets search engines index the site. Keep it off until the real domain is live. */
  readonly PUBLIC_ALLOW_INDEXING?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
