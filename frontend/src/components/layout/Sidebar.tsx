import { PanelLeft } from 'lucide-react'
import type { DashboardView, NavigationItem } from './navigation'
import { useTranslation } from '../../i18n'
import { cn } from '../../utils/cn'

interface SidebarProps {
  activeView: DashboardView
  items: NavigationItem[]
  collapsed: boolean
  onNavigate: (view: DashboardView) => void
  onToggleCollapsed: () => void
}

export function Sidebar({ activeView, items, collapsed, onNavigate, onToggleCollapsed }: SidebarProps) {
  const { t } = useTranslation()
  const primary = items.filter((item) => !item.demo)
  const demo = items.filter((item) => item.demo)
  const labelHidden = collapsed ? 'hidden' : 'max-[1100px]:hidden'
  const centered = collapsed ? 'justify-center' : 'max-[1100px]:justify-center'

  const renderItem = (item: NavigationItem) => {
    const Icon = item.icon
    const active = activeView === item.id
    return (
      <button
        key={item.id}
        type="button"
        title={t[item.labelKey]}
        onClick={() => onNavigate(item.id)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm font-semibold text-muted transition-colors',
          'hover:bg-canvas hover:text-ink',
          active && 'bg-selected text-accent hover:bg-selected hover:text-accent',
          centered,
        )}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden="true" />
        <span className={cn('truncate', labelHidden)}>{t[item.labelKey]}</span>
      </button>
    )
  }

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto border-e border-line bg-surface pt-7 pb-5 md:flex',
        collapsed ? 'w-[72px] px-3' : 'w-[254px] px-4 max-[1100px]:w-[72px] max-[1100px]:px-3',
      )}
    >
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className={cn('flex w-fit items-center gap-2 text-[15px] font-extrabold text-brand-navy', collapsed ? 'mx-auto' : 'ms-2 max-[1100px]:mx-auto')}
      >
        <img src="/AW.svg" alt="" className="size-[31px] object-contain" />
        <span className={cn('whitespace-nowrap', labelHidden)}>AutoWallet</span>
      </button>

      <nav className="mt-7 flex flex-col gap-1" aria-label="Main navigation">
        {primary.map(renderItem)}
        {demo.length > 0 && (
          <div className="mt-7">
            <p className={cn('mb-2.5 ms-3 text-3xs font-extrabold tracking-[0.12em] text-subtle uppercase', labelHidden)}>
              {t.navDemo}
            </p>
            {demo.map(renderItem)}
          </div>
        )}
      </nav>

      <button
        type="button"
        onClick={onToggleCollapsed}
        className={cn(
          'mt-auto flex w-fit items-center gap-2.5 text-xs font-semibold text-muted hover:text-ink max-[1100px]:hidden',
          collapsed ? 'mx-auto' : 'ms-2.5',
        )}
        aria-label={collapsed ? t.navExpand : t.navCollapse}
        aria-expanded={!collapsed}
      >
        <PanelLeft className="size-4 shrink-0" aria-hidden="true" />
        <span className={cn('whitespace-nowrap', labelHidden)}>{t.navCollapse}</span>
      </button>
    </aside>
  )
}
