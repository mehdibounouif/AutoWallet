import { useEffect, useState } from 'react'
import { en } from './locales/en'
import { fr } from './locales/fr'
import { ar } from './locales/ar'
import type { Locale, Translations } from './types'

export * from './types'

export const locales: Record<Locale, Translations> = { en, fr, ar }

export const STORAGE_KEY = 'autowallet_lang'
export const LOCALE_CHANGE_EVENT = 'autowallet_lang_change'

export function getLanguage(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'fr' || saved === 'ar' || saved === 'en') {
      return saved
    }
  } catch {
    // ignore localStorage errors (e.g. security sandboxes)
  }
  return 'en'
}

export function applyLanguage(lang: Locale) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }
}

export function setLanguage(lang: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // ignore
  }
  applyLanguage(lang)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { lang } }))
  }
}

// Initial setup on module load
if (typeof window !== 'undefined') {
  applyLanguage(getLanguage())
}

export function useTranslation() {
  const [lang, setLang] = useState<Locale>(getLanguage)

  useEffect(() => {
    const handler = () => {
      const current = getLanguage()
      setLang(current)
      applyLanguage(current)
    }
    window.addEventListener(LOCALE_CHANGE_EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const t = locales[lang] || locales.en

  return {
    t,
    lang,
    setLanguage,
    isRtl: lang === 'ar',
  }
}

export const translations: Translations = new Proxy({} as Translations, {
  get(_target, prop: string) {
    const currentLang = getLanguage()
    const dict = locales[currentLang] || locales.en
    return (dict as any)[prop] ?? (locales.en as any)[prop] ?? ''
  },
})
