import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { DashboardView, NavigationItem } from './navigation'
import { notificationsItem } from './navigation'
import { useTranslation } from '../../i18n'
import { cn } from '../../utils/cn'
import { Popover } from '../ui/Popover'

interface MobileNavProps {
  activeView: DashboardView
  items: NavigationItem[]
  onNavigate: (view: DashboardView) => void
}

const primaryIds = ['home', 'activity', 'envelopes', 'rules'] as const

export function MobileNav({ activeView, items, onNavigate }: MobileNavProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const moreItems = [...items.filter((item) => !primaryIds.includes(item.id as typeof primaryIds[number])), notificationsItem]
  const moreActive = moreItems.some((item) => item.id === activeView)

  const go = (view: DashboardView) => {
    setMenuOpen(false)
    onNavigate(view)
  }

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(65px+env(safe-area-inset-bottom))] justify-around border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {primaryIds.map((id) => {
          const item = items.find((entry) => entry.id === id)
          if (!item) return null
          const Icon = item.icon
          const active = activeView === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              aria-current={active ? 'page' : undefined}
              className={cn('flex flex-1 flex-col items-center justify-center gap-1 text-3xs font-semibold text-muted', active && 'text-accent')}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{t[item.labelKey]}</span>
            </button>
          )
        })}
        <button
          ref={setTrigger}
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          className={cn('flex flex-1 flex-col items-center justify-center gap-1 text-3xs font-semibold text-muted', moreActive && 'text-accent')}
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      <Popover
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        triggerRef={{ current: trigger }}
        align="end"
        position="fixed"
        className="end-2.5 bottom-[calc(69px+env(safe-area-inset-bottom))] grid min-w-[170px] overflow-hidden p-2"
      >
        <div role="menu" aria-label="More options">
          {moreItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => go(item.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-start text-[13px] font-semibold text-body hover:bg-canvas',
                  activeView === item.id && 'text-accent',
                )}
              >
                <Icon className="size-4 text-muted" aria-hidden="true" />
                {t[item.labelKey]}
              </button>
            )
          })}
        </div>
      </Popover>
    </>
  )
}
