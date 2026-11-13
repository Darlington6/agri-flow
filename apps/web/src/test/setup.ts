// Runs before every test file (see vitest.config.ts).
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount anything rendered by the previous test, so tests can't leak DOM
// into each other.
afterEach(() => {
  cleanup()
})
