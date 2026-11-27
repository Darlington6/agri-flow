import type { Notification } from '@/types'

export const notifications: Notification[] = [
  {
    id: 'N001',
    title: 'Supply shortfall risk',
    message: 'Potato contract #AG-204 may face a 9% supply shortfall against contracted volume.',
    severity: 'risk',
    createdAt: '2026-08-19',
    read: false,
    relatedContractId: 'AG-204',
    relatedRegions: ['Eastern Province', 'Southern Province'],
  },
  {
    id: 'N002',
    title: 'Rainfall risk detected',
    message: 'Heavy rainfall risk detected across 6 farms in Eastern Province and Northern Province regions.',
    severity: 'warning',
    createdAt: '2026-08-19',
    read: false,
    relatedRegions: ['Eastern Province', 'Northern Province'],
  },
  {
    id: 'N003',
    title: 'Missing crop updates',
    message: '3 farmers have not submitted their latest crop update.',
    severity: 'warning',
    createdAt: '2026-08-18',
    read: false,
    relatedRegions: ['Eastern Province', 'Northern Province'],
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
    title: 'Bean contract at risk',
    message: 'Contract #AG-217 is projected at 76% fulfillment due to drought exposure on two farms.',
    severity: 'risk',
    createdAt: '2026-08-17',
    read: true,
    relatedContractId: 'AG-217',
    relatedRegions: ['Northern Province'],
  },
  {
    id: 'N006',
    title: 'Delivery confirmed',
    message: 'Contract #AG-207 (avocados, Kigali Fresh Foods) was delivered on schedule.',
    severity: 'info',
    createdAt: '2026-07-30',
    read: true,
    relatedContractId: 'AG-207',
    relatedRegions: ['Eastern Province', 'Southern Province'],
  },
]

export const unreadNotifications = () => notifications.filter((n) => !n.read)
