// Light / dark theme. The choice ("system", "light" or "dark") is saved in
// this browser; "system" follows the device setting and changes with it.
// public/theme-init.js applies the saved choice before the first paint (so a
// dark page never flashes white); this module does the same afterwards and
// handles changes. Keep the two in step.
import type { ThemeMode } from '@agriflow/design-tokens'

export type { ThemeMode }
export const THEME_KEY = 'agriflow.theme'
const MODES: readonly ThemeMode[] = ['system', 'light', 'dark']

export function getThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return MODES.includes(saved as ThemeMode) ? (saved as ThemeMode) : 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode
}

export function applyTheme(mode: ThemeMode = getThemeMode()) {
  document.documentElement.dataset.theme = resolveTheme(mode)
}

export function setThemeMode(mode: ThemeMode) {
  try {
    if (mode === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, mode)
  } catch {
    // Private mode or blocked storage: the choice lasts until reload.
  }
  applyTheme(mode)
}

/** Keeps "system" in step with the device setting. Returns a cleanup function. */
export function followSystemTheme() {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (getThemeMode() === 'system') applyTheme('system')
  }
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
