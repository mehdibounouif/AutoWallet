import type { Translations } from '../../i18n'

export function LegalFooter({ t }: { t: Translations }) {
  return (
    <footer className="mt-6 text-center text-xs text-[#5E6B7E] flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() =>
          alert(
            'AutoWallet Privacy Policy: Your financial split rules are computed locally/securely.',
          )
        }
        className="hover:text-[#1A2330] hover:underline cursor-pointer"
      >
        {t.privacy}
      </button>
      <span>·</span>
      <button
        type="button"
        onClick={() => alert('AutoWallet Terms of Service: Ledger budgeting simulation.')}
        className="hover:text-[#1A2330] hover:underline cursor-pointer"
      >
        {t.terms}
      </button>
    </footer>
  )
}
