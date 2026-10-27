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
    if (saved === 'fr' || saved === 'ar' || saved === 'en') return saved
  } catch {
    // Browser storage may be unavailable in privacy sandboxes.
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
    // The in-memory language still applies when storage is blocked.
  }
  applyLanguage(lang)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { lang } }))
  }
}

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

  return { t: locales[lang] ?? locales.en, lang, setLanguage, isRtl: lang === 'ar' }
}

/** Translation lookup for non-reactive module code (labels inside metadata objects). */
export const translations: Translations = new Proxy({} as Translations, {
  get(_target, property: string | symbol) {
    if (typeof property !== 'string') return undefined
    const key = property as keyof Translations
    const dict = locales[getLanguage()] ?? locales.en
    return dict[key] ?? locales.en[key] ?? ''
  },
})
