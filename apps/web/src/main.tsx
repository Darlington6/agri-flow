import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { reactErrorHandler } from '@sentry/react'
import '@fontsource-variable/fraunces'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import './index.css'
import App from './App.tsx'
import { initMonitoring } from './lib/monitoring'

const reporting = initMonitoring()

createRoot(
  document.getElementById('root')!,
  // React hands its render errors to Sentry too (only when reporting is on).
  reporting
    ? {
        onUncaughtError: reactErrorHandler(),
        onCaughtError: reactErrorHandler(),
        onRecoverableError: reactErrorHandler(),
      }
    : {},
).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
