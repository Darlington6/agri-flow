import { apiUrl } from './config'

describe('apiUrl', () => {
  it('uses the address set for the build, without a trailing slash', () => {
    expect(apiUrl('https://api.example.com/', '192.168.1.20:8081')).toBe('https://api.example.com')
  })

  it("in development, finds the API on the computer that's serving the app", () => {
    expect(apiUrl(undefined, '192.168.1.20:8081')).toBe('http://192.168.1.20:8000')
    expect(apiUrl(undefined, undefined)).toBe('http://localhost:8000')
  })
})
