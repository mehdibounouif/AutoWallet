export function LegalFooter() {
  return (
    <footer className="mt-6 text-center text-xs text-brand-muted flex items-center justify-center gap-4">
      <a href="/privacy" target="_blank" rel="noopener noreferrer" aria-label="Privacy (opens in a new tab)" className="hover:text-brand-ink hover:underline">
        Privacy
      </a>
      <span>·</span>
      <a href="/terms" target="_blank" rel="noopener noreferrer" aria-label="Terms (opens in a new tab)" className="hover:text-brand-ink hover:underline">
        Terms
      </a>
    </footer>
  )
}
