import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { checkPublicUrls } from '@agriflow/config/public-url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // VITE_API_URL ends up in the public bundle: it must be a plain https://
    // address, and Vercel builds must have it (without it the app can't reach
    // the API at all).
    checkPublicUrls(['VITE_API_URL'], { required: process.env.VERCEL ? ['VITE_API_URL'] : [] }),
  ],
  // Which deployment this is, for error reports. Vercel sets these at build
  // time; they aren't secrets.
  define: {
    'import.meta.env.VITE_DEPLOY_ENV': JSON.stringify(process.env.VERCEL_ENV ?? 'development'),
    'import.meta.env.VITE_RELEASE': JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA ?? ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
