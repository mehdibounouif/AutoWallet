export type LegalDocumentKind = 'terms' | 'privacy'

export interface LegalPageLink {
  before: string
  to: string
  label: string
  after: string
}

export interface LegalSection {
  title: string
  paragraphs?: readonly string[]
  items?: readonly string[]
  pageLink?: LegalPageLink
  contactLine?: string
}

export interface LegalDocument {
  title: string
  intro: string
  lastUpdatedLabel: string
  studentNote: string
  sections: readonly LegalSection[]
}

export type LegalDocuments = Record<LegalDocumentKind, LegalDocument>
