import type { Translations } from '../../i18n'

export function LegalFooter({ t }: { t: Translations }) {
  return (
    <footer className="mt-6 flex items-center justify-center gap-4 text-center text-xs text-muted">
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Privacy (opens in a new tab)"
        className="hover:text-ink hover:underline"
      >
        {t.privacy}
      </a>
      <span aria-hidden="true">·</span>
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Terms (opens in a new tab)"
        className="hover:text-ink hover:underline"
      >
        {t.terms}
      </a>
    </footer>
  )
}
