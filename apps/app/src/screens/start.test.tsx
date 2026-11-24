import { render, screen } from '@testing-library/react-native'

import { I18nProvider } from '@/i18n'

import { Start } from './start'

describe('Start', () => {
  it('shows the logo, a heading and what is coming', async () => {
    await render(
      <I18nProvider>
        <Start />
      </I18nProvider>,
    )
    expect(screen.getByLabelText('AgriFlow')).toBeOnTheScreen()
    expect(screen.getByRole('heading', { name: 'Grow, sell and deliver with confidence' })).toBeOnTheScreen()
    expect(screen.getByText('Signing in to the app is coming soon.')).toBeOnTheScreen()
  })
})
