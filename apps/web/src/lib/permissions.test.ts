import { describe, expect, it } from 'vitest'
import type { DemoRole } from '@/types'
import { canAccess, isAdminRole, keyForPath, navKeysForRole, ROLE_PERMISSIONS } from './permissions'

const ALL_ROLES = Object.keys(ROLE_PERMISSIONS) as DemoRole[]

describe('isAdminRole', () => {
  it('treats Platform Admin and Super Admin as admins', () => {
    expect(isAdminRole('Platform Admin')).toBe(true)
    expect(isAdminRole('Super Admin')).toBe(true)
  })

  it('treats every other role, and no role, as non-admin', () => {
    for (const role of ['Buyer', 'Farmer', 'Field Agent', 'Delivery Partner'] as DemoRole[]) {
      expect(isAdminRole(role)).toBe(false)
    }
    expect(isAdminRole(null)).toBe(false)
    expect(isAdminRole(undefined)).toBe(false)
  })
})

describe('keyForPath', () => {
  it('maps a route and its sub-routes to the same permission key', () => {
    expect(keyForPath('/contracts')).toBe('contracts')
    expect(keyForPath('/contracts/AG-204')).toBe('contracts')
  })

  it('maps /buyers to the demand permission', () => {
    expect(keyForPath('/buyers/b-1')).toBe('demand')
  })

  it('returns null for paths that are not permission-gated', () => {
    expect(keyForPath('/')).toBeNull()
    expect(keyForPath('/no-such-page')).toBeNull()
  })
})

describe('canAccess', () => {
  it('lets Super Admin reach the executive view, but not Platform Admin', () => {
    expect(canAccess('Super Admin', '/executive')).toBe(true)
    expect(canAccess('Platform Admin', '/executive')).toBe(false)
  })

  it('gives Super Admin everything Platform Admin has', () => {
    for (const key of ROLE_PERMISSIONS['Platform Admin']) {
      expect(ROLE_PERMISSIONS['Super Admin']).toContain(key)
    }
  })

  it('keeps buyers out of farmer and production data', () => {
    expect(canAccess('Buyer', '/farmers')).toBe(false)
    expect(canAccess('Buyer', '/farmers/f-1')).toBe(false)
    expect(canAccess('Buyer', '/production')).toBe(false)
    expect(canAccess('Buyer', '/contracts/AG-204')).toBe(true)
  })

  it('keeps field agents out of demand, contracts and finance', () => {
    expect(canAccess('Field Agent', '/buyers')).toBe(false)
    expect(canAccess('Field Agent', '/contracts')).toBe(false)
    expect(canAccess('Field Agent', '/finance')).toBe(false)
  })

  it('limits delivery partners to their dashboard, job board and settings', () => {
    expect(canAccess('Delivery Partner', '/delivery')).toBe(true)
    expect(canAccess('Delivery Partner', '/dashboard')).toBe(true)
    expect(canAccess('Delivery Partner', '/contracts')).toBe(false)
    expect(canAccess('Delivery Partner', '/finance')).toBe(false)
  })

  it('never blocks paths outside the permission map (e.g. the 404 page)', () => {
    for (const role of ALL_ROLES) {
      expect(canAccess(role, '/no-such-page')).toBe(true)
    }
  })

  it('lets every role reach its dashboard and settings', () => {
    for (const role of ALL_ROLES) {
      expect(canAccess(role, '/dashboard')).toBe(true)
      expect(canAccess(role, '/settings')).toBe(true)
    }
  })
})

describe('navKeysForRole', () => {
  it('hides Contracts from the farmer sidebar while keeping the page reachable', () => {
    expect(navKeysForRole('Farmer')).not.toContain('contracts')
    expect(canAccess('Farmer', '/contracts/AG-204')).toBe(true)
  })

  it('only ever lists pages the role is allowed to reach', () => {
    for (const role of ALL_ROLES) {
      for (const key of navKeysForRole(role)) {
        expect(ROLE_PERMISSIONS[role]).toContain(key)
      }
    }
  })
})
