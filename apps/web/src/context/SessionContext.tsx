import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DemoRole, GhanaRegion } from '@/types'

// Demo identity each role is "logged in as" — this is what data/nav scoping is
// keyed off. In a real backend this would come from the authenticated user's
// account, not a hardcoded constant.
export const BUYER_DEMO_ID = 'B001' // Ghana Fresh Foods Ltd.
export const AGENT_DEMO_REGIONS: GhanaRegion[] = ['Bono', 'Bono East', 'Ashanti']
export const FARMER_DEMO_ID = 'F001' // Abena Owusu — supplies contract AG-204, in the Field Agent's regions
export const DELIVERY_PARTNER_DEMO_ID = 'DP-002' // Bono Freight Movers — covers the Field Agent's regions too

export interface Session {
  role: DemoRole
  name: string
  buyerId?: string
  agentRegions?: GhanaRegion[]
  farmerId?: string
  deliveryPartnerId?: string
}

interface SessionContextValue {
  session: Session | null
  login: (role: DemoRole) => void
  logout: () => void
}

const STORAGE_KEY = 'agriflow.demo-session'

function buildSession(role: DemoRole): Session {
  switch (role) {
    case 'Platform Admin':
      return { role, name: 'Desmond' }
    case 'Buyer':
      return { role, name: 'Nana', buyerId: BUYER_DEMO_ID }
    case 'Field Agent':
      return { role, name: 'Akosua', agentRegions: AGENT_DEMO_REGIONS }
    case 'Farmer':
      return { role, name: 'Abena', farmerId: FARMER_DEMO_ID }
    case 'Delivery Partner':
      return { role, name: 'Kwabena', deliveryPartnerId: DELIVERY_PARTNER_DEMO_ID }
    case 'Super Admin':
      return { role, name: 'Yaw' }
  }
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  })

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  }, [session])

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      login: (role: DemoRole) => setSession(buildSession(role)),
      logout: () => setSession(null),
    }),
    [session],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
