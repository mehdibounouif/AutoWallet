import { Link } from 'react-router-dom'
import { TopBar } from '../../components/layout/TopBar'
import { Page } from '../../components/ui/Page'
import { useTranslation } from '../../i18n'
import { legalDocuments } from '../../i18n/legal'
import type { LegalDocumentKind } from '../../i18n/legal'

interface LegalPageProps {
  document: LegalDocumentKind
}

const CONTACT_EMAIL = 'mohamedamintarza@gmail.com'

function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-action-primary-hover underline">
      {CONTACT_EMAIL}
    </a>
  )
}

export function LegalPage({ document }: LegalPageProps) {
  const { lang, t } = useTranslation()
  const content = legalDocuments[lang]?.[document] ?? legalDocuments.en[document]

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopBar />
      <Page as="main" width="reading" className="flex-1 px-4 py-8 sm:py-12">
        <article className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-10">
          <p className="text-xs font-semibold tracking-wider text-action-primary uppercase">AutoWallet</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">{content.title}</h1>
          <p className="mt-1 text-sm text-muted">{content.lastUpdatedLabel}</p>
          <p className="mt-3 leading-relaxed text-muted">{content.intro}</p>
          <div className="mt-8 space-y-7">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                {section.pageLink && (
                  <p className="mt-2 text-sm leading-7 text-brand-navy">
                    {section.pageLink.before}{' '}
                    <Link to={section.pageLink.to} className="font-medium text-action-primary-hover underline">
                      {section.pageLink.label}
                    </Link>
                    {section.pageLink.after}
                  </p>
                )}
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-2 text-sm leading-7 text-brand-navy">
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm leading-7 text-brand-navy">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.contactLine && (
                  <p className="mt-2 text-sm leading-7 text-brand-navy">
                    {section.contactLine} <ContactLink />.
                  </p>
                )}
              </section>
            ))}
          </div>
          <p className="mt-8 rounded-xl bg-selected px-4 py-3 text-sm text-brand-navy">
            {content.studentNote}
            <ContactLink />.
          </p>
          <nav aria-label={t.legalNavAria} className="mt-8 flex flex-wrap gap-5 text-sm font-medium text-action-primary-hover">
            <Link to="/login" className="hover:underline">{t.legalBackToLogin}</Link>
            <Link to={document === 'terms' ? '/privacy' : '/terms'} className="hover:underline">
              {document === 'terms' ? t.legalPrivacyTitle : t.legalTermsTitle}
            </Link>
          </nav>
        </article>
      </Page>
    </div>
  )
}
