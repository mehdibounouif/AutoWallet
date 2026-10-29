import { Activity, BarChart3, Bell, FlaskConical, House, Settings, SlidersHorizontal, Sparkles, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Translations } from '../../i18n'

export type DashboardView =
  | 'home'
  | 'activity'
  | 'envelopes'
  | 'rules'
  | 'analytics'
  | 'assistant'
  | 'sandbox'
  | 'settings'
  | 'notifications'

export interface NavigationItem {
  id: DashboardView
  labelKey: keyof Translations
  icon: LucideIcon
  path: string
  demo?: boolean
}

export const navigationItems: NavigationItem[] = [
  { id: 'home', labelKey: 'navHome', icon: House, path: '/dashboard' },
  { id: 'activity', labelKey: 'navActivity', icon: Activity, path: '/app/activity' },
  { id: 'envelopes', labelKey: 'navEnvelopes', icon: Wallet, path: '/app/envelopes' },
  { id: 'rules', labelKey: 'navRules', icon: SlidersHorizontal, path: '/app/rules' },
  { id: 'analytics', labelKey: 'navAnalytics', icon: BarChart3, path: '/app/analytics' },
  { id: 'assistant', labelKey: 'navAssistant', icon: Sparkles, path: '/app/assistant' },
  { id: 'sandbox', labelKey: 'navSandbox', icon: FlaskConical, path: '/app/sandbox', demo: true },
  { id: 'settings', labelKey: 'navSettings', icon: Settings, path: '/app/settings' },
]

export const notificationsItem: NavigationItem = {
  id: 'notifications',
  labelKey: 'navNotifications',
  icon: Bell,
  path: '/app/notifications',
}

export function viewFromPath(pathname: string): DashboardView {
  if (pathname.startsWith('/app/envelopes')) return 'envelopes'
  if (pathname.startsWith('/app/rules')) return 'rules'
  if (pathname.startsWith('/app/activity')) return 'activity'
  if (pathname.startsWith('/app/analytics')) return 'analytics'
  if (pathname.startsWith('/app/assistant')) return 'assistant'
  if (pathname.startsWith('/app/sandbox')) return 'sandbox'
  if (pathname.startsWith('/app/settings')) return 'settings'
  if (pathname.startsWith('/app/notifications')) return 'notifications'
  return 'home'
}
