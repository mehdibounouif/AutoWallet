import type { Language, Translations } from './types'
import { en } from './locales/en'
import { fr } from './locales/fr'
import { ar } from './locales/ar'

export * from './types'

export const translations: Record<Language, Translations> = {
  EN: en,
  FR: fr,
  AR: ar,
}

export function getTranslations(lang?: string): Translations {
  const code = (lang || 'EN').toUpperCase()
  if (code === 'FR') return translations.FR
  if (code === 'AR') return translations.AR
  return translations.EN
}
