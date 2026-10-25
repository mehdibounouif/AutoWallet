import { useEffect, useRef, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { setLanguage, useTranslation } from '../../i18n'
import type { Locale } from '../../i18n'

interface LanguageOption {
  code: Locale
  label: string
  nativeName: string
}

const languages: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'fr', label: 'French', nativeName: 'Français' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية' },
]

interface LanguageSelectorProps {
  className?: string
  compact?: boolean
}

export function LanguageSelector({ className = '', compact = false }: LanguageSelectorProps) {
  const { lang, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const selectLanguage = (code: Locale) => {
    setLanguage(code)
    setOpen(false)
  }

  const currentOption = languages.find((item) => item.code === lang) || languages[0]

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#5A6882] hover:text-[#253246] hover:bg-[#EEF2F6] transition-colors border border-[#DCE3EB] bg-white cursor-pointer select-none"
        aria-label={t.language}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4 shrink-0 text-[#6B7C96]" aria-hidden="true" />
        <span className="uppercase font-bold tracking-wider">{currentOption.code}</span>
        {!compact && (
          <span className="hidden sm:inline text-[11px] text-[#7A8A9E] border-s border-[#DCE3EB] ps-1.5">
            {currentOption.nativeName}
          </span>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t.language}
          className="absolute z-50 mt-1.5 min-w-[140px] rounded-xl bg-white p-1.5 shadow-lg border border-[#DCE3EB] text-xs font-medium text-[#2C384E] end-0"
        >
          {languages.map((option) => {
            const isSelected = option.code === lang
            return (
              <button
                key={option.code}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => selectLanguage(option.code)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#EEF1FA] text-[#5560B8] font-bold'
                    : 'text-[#44536A] hover:bg-[#F3F6FA] hover:text-[#1E293B]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="uppercase text-[11px] font-bold text-[#7E8EAA]">{option.code}</span>
                  <span>{option.nativeName}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#5560B8] shrink-0" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
