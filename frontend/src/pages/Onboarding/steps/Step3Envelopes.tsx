import { Home, Landmark, PiggyBank, ShoppingBag, Sparkles, Wallet } from 'lucide-react'
import type { Translations } from '../../../i18n'

interface Step3EnvelopesProps {
  t: Translations
}

export function Step3Envelopes({ t }: Step3EnvelopesProps) {
  const envelopeCards = [
    { id: 'rent', name: t.rentName, description: t.rentDesc, status: t.rentStatus, icon: Home, color: '#2270d8', tint: '#eaf2fc' },
    { id: 'tax', name: t.taxName, description: t.taxDesc, status: t.taxStatus, icon: Landmark, color: '#eb6834', tint: '#fdeee8' },
    { id: 'savings', name: t.savingsName, description: t.savingsDesc, status: t.savingsStatus, icon: PiggyBank, color: '#1baf7a', tint: '#e3f5ee' },
    { id: 'free', name: t.freeToSpendName, description: t.freeToSpendDesc, status: t.freeToSpendStatus, icon: ShoppingBag, color: '#eda100', tint: '#fdf3dc', focal: true, badge: t.freeToSpendBadge },
    { id: 'main', name: t.mainName, description: t.mainDesc, status: t.mainStatus, icon: Wallet, color: '#5e6b7e', tint: '#edf0f4' },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl px-2 sm:px-4">
      <div className="mb-8 space-y-2 text-center sm:text-start">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[32px]">{t.envelopesTitle}</h1>
        <p className="max-w-3xl text-[15px] leading-relaxed text-muted sm:text-base">{t.envelopesSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {envelopeCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.id}
              className={`flex min-h-[185px] flex-col justify-between rounded-2xl border bg-surface p-5 transition-shadow hover:shadow-xs sm:p-6 ${card.focal ? 'relative border-warning/60 shadow-xs ring-2 ring-warning/25' : 'border-line shadow-card'}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-[10px]"
                      style={{ backgroundColor: card.tint, color: card.color }}
                      aria-hidden="true"
                    >
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-ink sm:text-lg">{card.name}</h2>
                      <p className="mt-0.5 text-xs leading-snug text-muted sm:text-sm">{card.description}</p>
                    </div>
                  </div>
                  {card.focal && card.badge && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/30 bg-warning-soft px-2.5 py-0.5 text-2xs font-semibold text-warning-ink select-none">
                      <Sparkles className="size-3 text-warning" aria-hidden="true" />
                      <span>{card.badge}</span>
                    </span>
                  )}
                </div>

                <div className="my-4 flex items-baseline sm:my-5">
                  <span className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">0.00</span>
                  <span className="ms-1.5 text-xs font-medium text-muted sm:text-sm">MAD</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 border-t border-canvas pt-3 text-xs leading-tight text-subtle">
                <span>{card.status}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
