import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { LanguagesIcon } from '../icons'
import type { Language } from '../../i18n'

interface LanguageSelectorProps {
  currentLang: Language
  onSelectLang: (lang: Language) => void
  className?: string
}

export function LanguageSelector({
  currentLang,
  onSelectLang,
  className = '',
}: LanguageSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] border border-[#DDE3EA] bg-white text-[#1A2330] hover:bg-[#F3F6FA] text-sm font-medium transition cursor-pointer shadow-xs"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <LanguagesIcon className="w-4 h-4 text-[#3B495D]" />
        <span>{currentLang}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#5E6B7E]" />
      </button>

      {dropdownOpen && (
        <div
          className="absolute right-0 rtl:right-auto rtl:left-0 mt-1.5 w-32 bg-white border border-[#DDE3EA] rounded-xl shadow-lg py-1 z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          {(['EN', 'FR', 'AR'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                onSelectLang(lang)
                setDropdownOpen(false)
              }}
              className={`w-full px-3.5 py-2 text-left rtl:text-right text-sm flex items-center justify-between cursor-pointer transition ${
                currentLang === lang
                  ? 'bg-[#ECEEFA] text-[#5A64B4] font-semibold'
                  : 'text-[#3B495D] hover:bg-[#F3F6FA]'
              }`}
              role="menuitem"
            >
              <span>
                {lang === 'EN' && 'English'}
                {lang === 'FR' && 'Français'}
                {lang === 'AR' && 'العربية'}
              </span>
              {currentLang === lang && <Check className="w-3.5 h-3.5 text-[#5A64B4]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
