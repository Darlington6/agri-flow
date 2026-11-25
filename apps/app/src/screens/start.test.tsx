import { fireEvent, render, screen } from '@testing-library/react-native'
import { router } from 'expo-router'

import { I18nProvider } from '@/i18n'

import { Start } from './start'

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))

describe('Start', () => {
  it('shows the logo, a heading and the way in', async () => {
    await render(
      <I18nProvider>
        <Start />
      </I18nProvider>,
    )
    expect(screen.getByLabelText('AgriFlow')).toBeOnTheScreen()
    expect(screen.getByRole('heading', { name: 'Grow, sell and deliver with confidence' })).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in or create an account' }))
    expect(router.push).toHaveBeenCalledWith('/sign-in')
  })
})
