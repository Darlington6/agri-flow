import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { applyTheme, getThemeMode, THEME_KEY } from '@/lib/theme'
import { ThemeSwitcher } from './ThemeSwitcher'

function prefersDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: dark, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })
  afterEach(() => vi.unstubAllGlobals())

  it('follows the device setting until someone chooses', () => {
    prefersDark(true)
    applyTheme()
    expect(getThemeMode()).toBe('system')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('applies and remembers a chosen theme', async () => {
    prefersDark(false)
    render(<ThemeSwitcher />)
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()

    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked()

    await userEvent.click(screen.getByRole('radio', { name: 'System' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
  })

  it('ignores a saved value it does not know', () => {
    localStorage.setItem(THEME_KEY, 'purple')
    expect(getThemeMode()).toBe('system')
  })
})
