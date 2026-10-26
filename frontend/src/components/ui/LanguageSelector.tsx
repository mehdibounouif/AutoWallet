import { useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { setLanguage, useTranslation } from '../../i18n'
import type { Locale } from '../../i18n'
import { languages } from '../../i18n/languages'
import { cn } from '../../utils/cn'
import { Popover } from './Popover'

export function LanguageSelector({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { lang, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const current = languages.find((item) => item.code === lang) ?? languages[0]

  const choose = (code: Locale) => {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div className={cn('relative inline-block text-start', className)}>
      <button
        ref={setTrigger}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-muted transition-colors select-none hover:bg-canvas hover:text-ink"
      >
        <Globe className="size-4 shrink-0 text-muted" aria-hidden="true" />
        <span className="font-bold tracking-wider uppercase">{current.code}</span>
        {!compact && (
          <span className="hidden border-s border-line ps-1.5 text-2xs font-medium text-subtle sm:inline">
            {current.nativeName}
          </span>
        )}
      </button>

      <Popover open={open} onClose={() => setOpen(false)} triggerRef={trigger ? { current: trigger } : undefined} className="w-[168px] p-1.5">
        <div role="listbox" aria-label={t.language}>
          {languages.map((option) => {
            const selected = option.code === lang
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(option.code)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-xs transition-colors',
                  selected
                    ? 'bg-action-primary-subtle font-bold text-action-primary'
                    : 'font-medium text-body hover:bg-canvas hover:text-ink',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-2xs font-bold uppercase text-subtle">{option.code}</span>
                  <span>{option.nativeName}</span>
                </span>
                {selected && <Check className="size-3.5 shrink-0 text-action-primary" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </Popover>
    </div>
  )
}
