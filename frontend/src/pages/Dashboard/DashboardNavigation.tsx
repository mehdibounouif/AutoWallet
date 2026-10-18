import type { ComponentType, RefObject } from 'react'
import { BarChart3, Clock3, FlaskConical, LayoutDashboard, ListOrdered, Mail, Menu, MessageSquareText, PanelLeftClose, Settings } from 'lucide-react'

export type PageView = 'home' | 'envelopes' | 'rules' | 'activity' | 'analytics' | 'assistant' | 'sandbox' | 'notifications' | 'settings'
export type DashboardView = PageView | 'envelope-detail' | 'payment-detail'

const navigation: { view: PageView; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { view: 'home', label: 'Home', icon: LayoutDashboard },
  { view: 'envelopes', label: 'Envelopes', icon: Mail },
  { view: 'rules', label: 'Rules', icon: ListOrdered },
  { view: 'activity', label: 'Activity', icon: Clock3 },
  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
  { view: 'assistant', label: 'Assistant', icon: MessageSquareText },
  { view: 'settings', label: 'Settings', icon: Settings },
]

function isCurrent(active: DashboardView, item: PageView) {
  return active === item || active === 'envelope-detail' && item === 'envelopes' || active === 'payment-detail' && item === 'activity'
}

interface NavigationProps {
  active: DashboardView
  onNavigate: (view: PageView) => void
}

export function DashboardSidebar({ active, collapsed, onNavigate, onCollapse }: NavigationProps & { collapsed: boolean; onCollapse: () => void }) {
  return <aside className="dashboard-sidebar">
    <button type="button" onClick={() => onNavigate('home')} className="dashboard-logo" aria-label="AutoWallet Home">
      <img src="/AW.svg" alt="" /><span>AutoWallet</span>
    </button>
    <nav className="mt-10 space-y-1" aria-label="Main navigation">
      {navigation.map(({ view, label, icon: Icon }) => <button
        key={view} type="button" onClick={() => onNavigate(view)} title={label}
        aria-current={isCurrent(active, view) ? 'page' : undefined}
        className={`dashboard-nav-item ${isCurrent(active, view) ? 'dashboard-nav-item--active' : ''}`}
      ><Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /><span>{label}</span></button>)}
    </nav>
    <div className="dashboard-sidebar-demo">
      <p>DEMO</p>
      <button type="button" onClick={() => onNavigate('sandbox')} aria-current={active === 'sandbox' ? 'page' : undefined}
        className={`dashboard-nav-item ${active === 'sandbox' ? 'dashboard-nav-item--active' : ''}`} title="Sandbox">
        <FlaskConical className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /><span>Sandbox</span>
      </button>
    </div>
    <button type="button" onClick={onCollapse} className="dashboard-sidebar-collapse" aria-expanded={!collapsed}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
      <PanelLeftClose className="h-4 w-4" aria-hidden="true" /><span>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
    </button>
  </aside>
}

const mobileItems = [
  { view: 'home', label: 'Home', icon: LayoutDashboard },
  { view: 'rules', label: 'Rules', icon: ListOrdered },
  { view: 'activity', label: 'Activity', icon: Clock3 },
  { view: 'assistant', label: 'Assistant', icon: MessageSquareText },
] as const
const moreItems = ['envelopes', 'analytics', 'sandbox', 'settings'] as const

export function DashboardMobileNavigation({ active, onNavigate, open, onToggle, onSignOut, navRef, menuRef }: NavigationProps & {
  open: boolean; onToggle: () => void; onSignOut: () => void
  navRef: RefObject<HTMLElement | null>; menuRef: RefObject<HTMLDivElement | null>
}) {
  const moreActive = moreItems.some(view => isCurrent(active, view))
  return <>
    <nav ref={navRef} className="dashboard-mobile-nav" aria-label="Mobile navigation">
      {mobileItems.map(({ view, label, icon: Icon }) => <button key={view} type="button" onClick={() => onNavigate(view)}
        aria-current={isCurrent(active, view) ? 'page' : undefined} className={isCurrent(active, view) ? 'is-active' : ''}>
        <Icon aria-hidden="true" /><span>{label}</span>
      </button>)}
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={open ? 'dashboard-more-menu' : undefined} className={moreActive ? 'is-active' : ''}>
        <Menu aria-hidden="true" /><span>More</span>
      </button>
    </nav>
    {open && <div id="dashboard-more-menu" className="dashboard-more-menu" ref={menuRef}>
      {moreItems.map(view => <button key={view} type="button" onClick={() => onNavigate(view)} aria-current={isCurrent(active, view) ? 'page' : undefined}>
        {view.charAt(0).toUpperCase() + view.slice(1)}
      </button>)}
      <button type="button" onClick={onSignOut}>Sign out</button>
    </div>}
  </>
}
