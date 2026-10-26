import type { Locale } from './types'

export interface LanguageOption {
  code: Locale
  nativeName: string
}

/** BCP-47 tags used for dates and numbers. */
export const intlLocales: Record<Locale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-MA',
}

/** Language autonyms are intentionally locale-independent. */
export const languages: LanguageOption[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'ar', nativeName: 'العربية' },
]
