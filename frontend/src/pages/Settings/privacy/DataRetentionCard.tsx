import { Link } from 'react-router-dom'
import { SettingsCard } from '../SettingsCard'

export function DataRetentionCard() {
  const rows = [
    ['Profile', 'Name, email and linked account ID'],
    ['Money', 'Envelopes, rules and payments'],
    ['In your browser', 'Sign-in token and notification preferences'],
    ['Read status', 'Which payment notifications you’ve read'],
  ]

  return (
    <SettingsCard title="What we keep">
      <dl className="mt-4 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-line py-3.5 max-md:flex-col max-md:gap-1">
            <dt className="shrink-0 font-medium text-muted">{label}</dt>
            <dd className="text-end font-semibold text-body max-md:text-start">{value}</dd>
          </div>
        ))}
      </dl>
      <Link to="/privacy" className="mt-4 inline-flex text-xs font-bold text-accent hover:underline">Read our privacy notice</Link>
    </SettingsCard>
  )
}
