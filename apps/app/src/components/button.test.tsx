import { fireEvent, render, screen } from '@testing-library/react-native'

import { Button } from './button'

describe('Button', () => {
  it('is a button named by its label', async () => {
    const onPress = jest.fn()
    await render(<Button label="Continue" onPress={onPress} />)
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does nothing and says so while disabled', async () => {
    const onPress = jest.fn()
    await render(<Button label="Continue" onPress={onPress} disabled />)
    const button = screen.getByRole('button', { name: 'Continue' })
    expect(button).toBeDisabled()
    await fireEvent.press(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows progress instead of the label while busy', async () => {
    await render(<Button label="Continue" accessibilityLabel="Continue" busy />)
    expect(screen.queryByText('Continue')).toBeNull()
    expect(screen.getByRole('button')).toBeBusy()
  })
})
