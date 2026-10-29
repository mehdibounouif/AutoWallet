import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { Button } from '../../components/ui/Button'
import { FormCard } from '../../components/ui/FormCard'
import { AuthShell } from '../../components/layout/AuthShell'

interface SessionEndedCardProps {
  onLogInAgain?: () => void
}

export function SessionEndedCard({ onLogInAgain }: SessionEndedCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectPath = searchParams.get('redirect') || searchParams.get('return_to')

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${t.sessionEndedTitle} · AutoWallet`
    return () => { document.title = previousTitle }
  }, [t.sessionEndedTitle])

  const handleAction = () => {
    if (onLogInAgain) {
      onLogInAgain()
      return
    }
    const redirectQuery = redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''
    navigate(`/login${redirectQuery}`)
  }

  return (
    <AuthShell>
      <FormCard className="flex flex-col items-center text-center">
        <span className="mb-5 grid size-12 place-items-center rounded-full bg-action-primary-subtle text-action-primary">
          <Clock className="size-6" aria-hidden="true" />
        </span>
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t.sessionEndedTitle}</h1>
          <p className="max-w-[340px] text-[15px] leading-relaxed text-muted">{t.sessionEndedSubtitle}</p>
        </div>
        <Button size="lg" className="w-full" onClick={handleAction}>{t.logInAgainButton}</Button>
      </FormCard>
    </AuthShell>
  )
}
