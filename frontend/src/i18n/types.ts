import type { en } from './locales/en'

export type Translations = Record<keyof typeof en, string>
export type Locale = 'en' | 'fr' | 'ar'

