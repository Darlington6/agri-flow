import type { Notification } from '@/types'

export const notifications: Notification[] = [
  {
    id: 'N001',
    title: 'Supply shortfall risk',
    message: 'Tomato contract #AG-204 may face a 9% supply shortfall against contracted volume.',
    severity: 'risk',
    createdAt: '2026-08-19',
    read: false,
    relatedContractId: 'AG-204',
    relatedRegions: ['Bono', 'Bono East', 'Ashanti'],
  },
  {
    id: 'N002',
    title: 'Rainfall risk detected',
    message: 'Heavy rainfall risk detected across 6 farms in Bono East and Northern regions.',
    severity: 'warning',
    createdAt: '2026-08-19',
    read: false,
    relatedRegions: ['Bono East', 'Northern'],
  },
  {
    id: 'N003',
    title: 'Missing crop updates',
    message: '3 farmers have not submitted their latest crop update.',
    severity: 'warning',
    createdAt: '2026-08-18',
    read: false,
    relatedRegions: ['Bono East', 'Northern'],
  },
  {
    id: 'N004',
    title: 'Storage capacity risk',
    message: "Cold-storage capacity may be insufficient for next week's expected harvest.",
    severity: 'risk',
    createdAt: '2026-08-18',
    read: false,
  },
  {
    id: 'N005',
    title: 'Onion contract at risk',
    message: 'Contract #AG-217 is projected at 76% fulfillment due to drought exposure on two farms.',
    severity: 'risk',
    createdAt: '2026-08-17',
    read: true,
    relatedContractId: 'AG-217',
    relatedRegions: ['Northern', 'Upper West'],
  },
  {
    id: 'N006',
    title: 'Delivery confirmed',
    message: 'Contract #AG-207 (peppers, Ghana Fresh Foods) was delivered on schedule.',
    severity: 'info',
    createdAt: '2026-07-30',
    read: true,
    relatedContractId: 'AG-207',
    relatedRegions: ['Bono East', 'Ashanti'],
  },
]

export const unreadNotifications = () => notifications.filter((n) => !n.read)
