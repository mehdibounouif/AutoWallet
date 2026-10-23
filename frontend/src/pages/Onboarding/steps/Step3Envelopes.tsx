import { Home, Landmark, PiggyBank, ShoppingBag, Wallet, Sparkles } from 'lucide-react'

export function Step3Envelopes() {
  const envelopeCards = [
    {
      id: 'rent',
      name: "Rent",
      desc: "Reserves the rent amount first from each payment",
      amount: '0.00',
      currency: 'MAD',
      status: "Fills first from your next payment",
      icon: Home,
      iconColor: '#2270D8',
      bgColor: '#EAF2FC',
      isFocal: false,
    },
    {
      id: 'tax',
      name: "Tax",
      desc: "15% of what's left after Rent",
      amount: '0.00',
      currency: 'MAD',
      status: "Fills from your next payment",
      icon: Landmark,
      iconColor: '#EB6834',
      bgColor: '#FDEEE8',
      isFocal: false,
    },
    {
      id: 'savings',
      name: "Savings",
      desc: "15% of what's left, until 10,000.00",
      amount: '0.00',
      currency: 'MAD',
      status: "Fills from your next payment",
      icon: PiggyBank,
      iconColor: '#1BAF7A',
      bgColor: '#E3F5EE',
      isFocal: false,
    },
    {
      id: 'free',
      name: "Free to spend",
      desc: "Everything left after the other rules",
      amount: '0.00',
      currency: 'MAD',
      status: "Fills from your next payment",
      icon: ShoppingBag,
      iconColor: '#EDA100',
      bgColor: '#FDF3DC',
      isFocal: true,
      badge: "Yours to spend",
    },
    {
      id: 'main',
      name: "Main",
      desc: "Anything the rules don't take",
      amount: '0.00',
      currency: 'MAD',
      status: "Nothing so far: your rules use every payment",
      icon: Wallet,
      iconColor: '#5E6B7E',
      bgColor: '#EDF0F4',
      isFocal: false,
    },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
      {/* Step 3 Heading */}
      <div className="mb-8 space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-[32px] font-semibold text-brand-ink tracking-tight">
          Five envelopes, one job each
        </h1>
        <p className="text-[15px] sm:text-base text-brand-muted leading-relaxed max-w-3xl">
          Every payment is split between them, in the order of your rules. Main catches anything your rules don't take.
        </p>
      </div>

      {/* 5 Envelope Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {envelopeCards.map((card) => {
          const IconComponent = card.icon

          return (
            <div
              key={card.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all hover:shadow-xs min-h-[185px] ${
                card.isFocal
                  ? 'border-free-solid/60 ring-2 ring-free-solid/25 shadow-xs relative'
                  : 'border-border-subtle shadow-2xs'
              }`}
            >
              <div>
                {/* Top Header Row with Icon Tile and Titles */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: card.bgColor, color: card.iconColor }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-brand-ink tracking-tight">
                        {card.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-brand-muted leading-snug mt-0.5">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  {card.isFocal && card.badge && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-free-ink bg-free-tint px-2.5 py-0.5 rounded-full border border-free-solid/30 shrink-0 select-none">
                      <Sparkles className="w-3 h-3 text-free-solid" />
                      <span>{card.badge}</span>
                    </span>
                  )}
                </div>

                {/* Middle Balance Amount */}
                <div className="my-4 sm:my-5 flex items-baseline">
                  <span className="text-2xl sm:text-[28px] font-bold text-brand-ink tracking-tight">
                    {card.amount}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-brand-muted ml-1.5">
                    {card.currency}
                  </span>
                </div>
              </div>

              {/* Bottom Status / Rule Note */}
              <div className="pt-3 border-t border-brand-surface text-xs text-brand-muted flex items-center gap-1.5 leading-tight">
                <span>{card.status}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
