import { describe, expect, it } from 'vitest'
import type { Session } from '@/context/SessionContext'
import { farmerById, farmerGroupById } from '@/data'
import { navForRole } from '@/components/layout/navigation'
import { canAccess } from './permissions'
import {
  canViewContract,
  canViewFarmer,
  currentCooperative,
  scopedContracts,
  scopedFarmers,
  scopedPayments,
  scopedRegions,
} from './scope'

const coop: Session = { role: 'Cooperative', name: 'Akua', cooperativeId: 'G001' }
const members = new Set(farmerGroupById('G001')!.farmerIds)

describe('the Cooperative demo role', () => {
  it('sees its own members, and only them', () => {
    const farmers = scopedFarmers(coop)
    expect(farmers.map((f) => f.id).sort()).toEqual([...members].sort())
    expect(canViewFarmer(coop, farmerById('F001')!)).toBe(true) // Abena, the Farmer demo role
    expect(canViewFarmer(coop, farmerById('F003')!)).toBe(false) // Ashanti, not a member
  })

  it("sees the contracts its members are on, and not others'", () => {
    const ids = scopedContracts(coop).map((c) => c.id)
    expect(ids).toEqual(expect.arrayContaining(['AG-204', 'AG-205', 'AG-207', 'AG-188']))
    for (const c of scopedContracts(coop)) expect(c.farmerIds.some((f) => members.has(f))).toBe(true)
    const onions = scopedContracts({ role: 'Platform Admin', name: 'x' }).find((c) => c.id === 'AG-206')!
    expect(canViewContract(coop, onions)).toBe(false)
  })

  it("sees payments to its members only, in its members' regions", () => {
    for (const p of scopedPayments(coop)) expect(members.has(p.counterpartyId)).toBe(true)
    expect(scopedRegions(coop).sort()).toEqual(['Bono', 'Bono East'])
  })

  it('knows which cooperative it manages', () => {
    expect(currentCooperative(coop)?.name).toBe("Techiman Growers' Cooperative")
    expect(currentCooperative({ role: 'Farmer', name: 'Abena', farmerId: 'F001' })).toBeUndefined()
  })

  it('calls its farmers "Members" and reaches only its pages', () => {
    const nav = navForRole('Cooperative')
    expect(nav.find((i) => i.key === 'farmers')?.label).toBe('Members')
    expect(nav.map((i) => i.key)).not.toContain('finance')
    expect(canAccess('Cooperative', '/contracts/AG-204')).toBe(true)
    expect(canAccess('Cooperative', '/executive')).toBe(false)
    expect(canAccess('Cooperative', '/buyers')).toBe(false)
  })
})
