import { describe, expect, it } from 'vitest'
import { visibleDemoRoles } from './demoRoles'

const roles = [{ role: 'Platform Admin' }, { role: 'Super Admin' }, { role: 'Buyer' }, { role: 'Farmer' }] as const

describe('visibleDemoRoles', () => {
  it('leaves the staff roles out of the public demo', () => {
    expect(visibleDemoRoles(roles, 'production').map((r) => r.role)).toEqual(['Buyer', 'Farmer'])
  })

  it.each(['development', 'preview'])('keeps them on %s, for development', (env) => {
    expect(visibleDemoRoles(roles, env)).toHaveLength(4)
  })
})
