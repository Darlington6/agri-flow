import { describe, expect, it } from 'vitest'
import { checkPublicUrls, publicUrlProblem } from '@agriflow/config/public-url'

// The shape of a pasted database connection string. Built from parts so the
// repo never holds credential-shaped text (secret scanners rightly flag it).
const DATABASE_URL = ['postgresql:', '', `owner:${'s3cret'}@db.example.test`, 'neondb'].join('/')

describe('publicUrlProblem', () => {
  it.each([
    ['https://agriflow-api.onrender.com'],
    ['https://agri-flow-eight.vercel.app'],
    ['http://localhost:8000'],
    ['http://127.0.0.1:8000'],
    [undefined],
    [''],
  ])('accepts %s', (value) => {
    expect(publicUrlProblem(value)).toBeNull()
  })

  it.each([
    [DATABASE_URL, 'must start with https://'],
    ['agriflow-api.onrender.com', "isn't a web address"],
    ['http://agriflow-api.onrender.com', 'must start with https://'],
    ['https://user:pass@agriflow-api.onrender.com', 'must not contain a username or password'],
    ['https://agriflow-api.onrender.com/api/v1', 'must be just the address, with no path after it'],
    ['https://agriflow-api.onrender.com?x=1', 'must be just the address, with no path after it'],
    ['https://agriflow-api.onrender.com/', 'must not end with a slash'],
  ])('refuses %s', (value, problem) => {
    expect(publicUrlProblem(value)).toBe(problem)
  })
})

describe('checkPublicUrls', () => {
  const run = (env: Record<string, unknown>, required: string[] = []) => () =>
    checkPublicUrls(['VITE_API_URL'], { required }).configResolved({ env })

  it('lets a good address through', () => {
    expect(run({ VITE_API_URL: 'https://agriflow-api.onrender.com' })).not.toThrow()
  })

  it('stops the build on a pasted database string without printing it', () => {
    expect(run({ VITE_API_URL: DATABASE_URL })).toThrow('VITE_API_URL must start with https://')
    expect(run({ VITE_API_URL: DATABASE_URL })).not.toThrow(/s3cret|example\.test/)
  })

  it('allows an unset address unless it is required', () => {
    expect(run({})).not.toThrow()
    expect(run({}, ['VITE_API_URL'])).toThrow('VITE_API_URL must be set for this build.')
  })

  it('only runs for builds, not the dev server', () => {
    expect(checkPublicUrls([]).apply).toBe('build')
  })
})
