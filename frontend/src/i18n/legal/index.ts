import type { Locale } from '../types'
import { legalAr } from './ar'
import { legalEn } from './en'
import { legalFr } from './fr'
import type { LegalDocuments } from './types'

export const legalDocuments: Record<Locale, LegalDocuments> = {
  en: legalEn,
  fr: legalFr,
  ar: legalAr,
}

export type {
  LegalDocument,
  LegalDocumentKind,
  LegalDocuments,
  LegalPageLink,
  LegalSection,
} from './types'
