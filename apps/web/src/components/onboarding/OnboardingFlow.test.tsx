import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError, type SetupOptions } from '@/lib/apiClient'
import { OnboardingFlow, type OnboardingDriver } from './OnboardingFlow'

const OPTIONS: SetupOptions = {
  country: 'RW',
  regions: [
    { name: 'Northern Province', districts: ['Burera', 'Musanze'] },
    { name: 'Southern Province', districts: ['Huye'] },
  ],
  crops: [
    { value: 'maize', label: 'Maize' },
    { value: 'beans', label: 'Beans' },
  ],
  buyer_types: [{ value: 'processor', label: 'Processor' }],
  vehicle_types: [
    { value: 'motorbike', label: 'Motorbike' },
    { value: 'truck', label: 'Truck' },
  ],
}

function fakeDriver(start: Partial<OnboardingDriver['start']> = {}): OnboardingDriver {
  return {
    start: {
      name: '',
      country: '',
      language: '',
      roles: [],
      staff: false,
      hasPhone: false,
      returning: false,
      next: 'name',
      termsVersion: 'v1',
      ...start,
    },
    loadOptions: vi.fn(async () => OPTIONS),
    saveName: vi.fn(async () => {}),
    savePlace: vi.fn(async () => {}),
    chooseRole: vi.fn(async () => {}),
    requestPhoneCode: vi.fn(async () => ({})),
    confirmPhone: vi.fn(async () => {}),
    skipPhone: vi.fn(async () => {}),
    finish: vi.fn(async () => {}),
  }
}

describe('OnboardingFlow', () => {
  it('walks through every step, saving each, and finishes', async () => {
    const driver = fakeDriver()
    const onDone = vi.fn()
    render(<OnboardingFlow driver={driver} onDone={onDone} />)

    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Your name'), '  Aline Uwase ')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(driver.saveName).toHaveBeenCalledWith('Aline Uwase')

    // Country and language start from the device; both can change.
    expect(await screen.findByRole('heading', { name: 'Where are you?' })).toHaveFocus()
    await userEvent.selectOptions(screen.getByLabelText('Country'), 'RW')
    await userEvent.click(screen.getByLabelText('Ikinyarwanda'))
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(driver.savePlace).toHaveBeenCalledWith('RW', 'rw')

    await userEvent.click(await screen.findByRole('button', { name: /Farmer/ }))
    expect(screen.getByRole('heading', { name: 'About your farm' })).toBeInTheDocument()
    await userEvent.selectOptions(await screen.findByLabelText('Province'), 'Northern Province')
    await userEvent.selectOptions(screen.getByLabelText('District'), 'Musanze')
    await userEvent.click(screen.getByRole('button', { name: 'Maize' }))
    expect(screen.getByRole('button', { name: 'Maize' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(driver.chooseRole).toHaveBeenCalledWith('farmer', {
      region: 'Northern Province',
      district: 'Musanze',
      crops: ['maize'],
      farm_size_hectares: null,
      cooperative_name: '',
    })

    expect(await screen.findByRole('heading', { name: 'Add your phone number' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Skip for now' }))
    expect(driver.skipPhone).toHaveBeenCalled()

    const finish = await screen.findByRole('button', { name: 'Finish' })
    expect(finish).toBeDisabled()
    expect(screen.getByRole('link', { name: /terms of use/ })).toHaveAttribute(
      'href',
      'https://agri-flow-site.vercel.app/terms',
    )
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(finish)
    expect(driver.finish).toHaveBeenCalledWith('v1')
    expect(onDone).toHaveBeenCalled()
  })

  it('picks up at the first step not done yet', () => {
    render(<OnboardingFlow driver={fakeDriver({ name: 'Aline', next: 'role' })} onDone={() => {}} />)
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What brings you to AgriFlow?' })).toBeInTheDocument()
  })

  it('leaves out the phone step for someone who signed up with one, and the role step for staff', () => {
    render(<OnboardingFlow driver={fakeDriver({ hasPhone: true, staff: true, next: 'terms' })} onDone={() => {}} />)
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
  })

  it('asks someone already set up only to agree to the new terms', () => {
    render(<OnboardingFlow driver={fakeDriver({ returning: true, next: 'terms' })} onDone={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Our terms have changed' })).toBeInTheDocument()
    expect(screen.queryByText(/Step/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('goes back with what was typed still there', async () => {
    render(<OnboardingFlow driver={fakeDriver({ name: 'Aline', next: 'place' })} onDone={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('Your name')).toHaveValue('Aline')
  })

  it('needs at least one crop before saving', async () => {
    const driver = fakeDriver({ name: 'Aline', country: 'RW', language: 'en', next: 'role' })
    render(<OnboardingFlow driver={driver} onDone={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Farmer/ }))
    await userEvent.selectOptions(await screen.findByLabelText('Province'), 'Southern Province')
    await userEvent.selectOptions(screen.getByLabelText('District'), 'Huye')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Choose at least one crop.')).toBeInTheDocument()
    expect(driver.chooseRole).not.toHaveBeenCalled()
  })

  it("shows the API's field messages on the form", async () => {
    const driver = fakeDriver({ name: 'Aline', country: 'RW', language: 'en', next: 'role' })
    driver.chooseRole = vi.fn(async () => {
      throw new ApiError('Enter your business name.', 400, { business_name: ['Enter your business name.'] })
    })
    render(<OnboardingFlow driver={driver} onDone={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Buyer/ }))
    await userEvent.type(await screen.findByLabelText('Business name'), 'x')
    await userEvent.selectOptions(screen.getByLabelText('Type of business'), 'processor')
    await userEvent.selectOptions(screen.getByLabelText('Province'), 'Southern Province')
    await userEvent.selectOptions(screen.getByLabelText('District'), 'Huye')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Enter your business name.')).toBeInTheDocument()
    expect(screen.getByLabelText('Business name')).toHaveAttribute('aria-invalid', 'true')
  })

  it('confirms a phone number with the texted code', async () => {
    const driver = fakeDriver({ name: 'A', country: 'RW', language: 'en', roles: ['buyer'], next: 'phone' })
    driver.requestPhoneCode = vi.fn(async () => ({ debugCode: '123456' }))
    render(<OnboardingFlow driver={driver} onDone={() => {}} />)
    await userEvent.type(screen.getByLabelText('Phone number'), '0788123456')
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }))
    expect(driver.requestPhoneCode).toHaveBeenCalledWith('+250788123456')
    await userEvent.type(await screen.findByLabelText('6-digit code'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(driver.confirmPhone).toHaveBeenCalledWith('+250788123456', '123456')
    expect(await screen.findByRole('heading', { name: 'One last thing' })).toBeInTheDocument()
  })

  it('types the region where the country has no list', async () => {
    const driver = fakeDriver({ name: 'A', country: 'KE', language: 'sw', next: 'role' })
    driver.loadOptions = vi.fn(async () => ({ ...OPTIONS, country: 'KE', regions: null }))
    render(<OnboardingFlow driver={driver} onDone={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Delivery partner/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Truck' }))
    await userEvent.type(screen.getByLabelText('Where you deliver'), 'Nakuru, Nairobi ,')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(driver.loadOptions).toHaveBeenCalledWith('KE')
    expect(driver.chooseRole).toHaveBeenCalledWith('delivery_partner', {
      business_name: '',
      vehicle_types: ['truck'],
      service_regions: ['Nakuru', 'Nairobi'],
    })
  })

  it("doesn't offer roles the account already has", async () => {
    render(
      <OnboardingFlow
        driver={fakeDriver({ name: 'A', country: 'RW', language: 'en', roles: ['farmer'], next: 'phone' })}
        onDone={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText(/You're set up as farmer/)).toBeInTheDocument()
  })
})
