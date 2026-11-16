import { describe, expect, it, vi } from 'vitest'
import { demoRequestPayload, submitDemoRequest } from '../src/lib/demoRequest'
import { AFRICAN_COUNTRIES, countryOptions, demoRequestEndpoint } from '../src/lib/countries'

function form(overrides: Record<string, string> = {}) {
  const data = new FormData()
  const values: Record<string, string> = {
    name: '  Aline Uwase ',
    organisation: 'Musanze Growers',
    role: 'farmerGroup',
    country: 'RW',
    email: 'aline@example.org',
    phone: '',
    message: '',
    consent: 'on',
    website: '',
    ...overrides,
  }
  for (const [k, v] of Object.entries(values)) data.set(k, v)
  return data
}

describe('demo request payload', () => {
  it('trims text and turns the checkbox into a boolean', () => {
    expect(demoRequestPayload(form(), 'en')).toMatchObject({ name: 'Aline Uwase', country: 'RW', consent: true, locale: 'en' })
    expect(demoRequestPayload(form({ consent: '' }), 'en').consent).toBe(false)
  })

  it('never sends the spam-trap field', () => {
    expect(demoRequestPayload(form(), 'en')).not.toHaveProperty('website')
  })
})

describe('submitDemoRequest', () => {
  const endpoint = 'https://api.example/api/v1/leads/demo-requests/'

  it('posts JSON to the endpoint and reports success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }))
    expect(await submitDemoRequest(endpoint, form(), 'en', fetchImpl)).toBe('sent')
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(endpoint)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toMatchObject({ email: 'aline@example.org' })
  })

  it('reports failure for an error response or a network error', async () => {
    expect(await submitDemoRequest(endpoint, form(), 'en', vi.fn().mockResolvedValue(new Response('', { status: 400 })))).toBe('failed')
    expect(await submitDemoRequest(endpoint, form(), 'en', vi.fn().mockRejectedValue(new TypeError('offline')))).toBe('failed')
  })

  it('fails clearly when no API address is configured', async () => {
    const fetchImpl = vi.fn()
    expect(await submitDemoRequest(undefined, form(), 'en', fetchImpl)).toBe('failed')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('quietly drops submissions that fill the spam trap', async () => {
    const fetchImpl = vi.fn()
    expect(await submitDemoRequest(endpoint, form({ website: 'http://spam.example' }), 'en', fetchImpl)).toBe('ignored')
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('countries', () => {
  it('lists all 54 African countries once', () => {
    expect(AFRICAN_COUNTRIES).toHaveLength(54)
    expect(new Set(AFRICAN_COUNTRIES).size).toBe(54)
  })

  it('names and sorts them in the page language', () => {
    const en = countryOptions('en')
    expect(en.find((c) => c.code === 'RW')?.name).toBe('Rwanda')
    const names = en.map((c) => c.name)
    expect(names).toEqual(names.toSorted((a, b) => a.localeCompare(b, 'en')))
    expect(countryOptions('fr').find((c) => c.code === 'ZA')?.name).toBe('Afrique du Sud')
  })

  it('builds the API endpoint from the configured base URL', () => {
    expect(demoRequestEndpoint('https://api.example')).toBe('https://api.example/api/v1/leads/demo-requests/')
    expect(demoRequestEndpoint(undefined)).toBeUndefined()
  })
})
