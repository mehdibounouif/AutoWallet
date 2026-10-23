import { Button } from '../../components/ui/Button'
import { AuthPanel } from '../../components/ui/AuthPanel'
import { LegalFooter } from '../../components/common/LegalFooter'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock } from 'lucide-react'

interface SessionEndedCardProps {
  onLogInAgain?: () => void
}

export function SessionEndedCard({
  onLogInAgain,
}: SessionEndedCardProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const redirectPath = searchParams.get('redirect') || searchParams.get('return_to')

  // Set document title per Figma A5 A11y requirement
  useEffect(() => {
    const previousTitle = document.title
    document.title = `Your session ended · AutoWallet`
    return () => { document.title = previousTitle }
  }, [])

  const handleAction = () => {
    if (onLogInAgain) {
      onLogInAgain()
    } else {
      const redirectQuery = redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''
      navigate(`/login${redirectQuery}`)
    }
  }

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10 animate-in fade-in duration-200">
      {/* 440px Centered White Card per Figma A5 (#115:879 & #115:914) */}
      <AuthPanel className="text-center flex flex-col items-center">
        {/* Clock Icon container (Figma EL-f775418e) */}
        <div className="w-12 h-12 rounded-full bg-action-primary-subtle flex items-center justify-center mb-5 text-action-primary">
          <Clock className="w-6 h-6" />
        </div>

        {/* Card Heading (Figma EL-bc40306a) */}
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-semibold text-brand-ink tracking-tight">
            Your session ended
          </h1>
          <p className="text-[15px] text-brand-muted leading-relaxed max-w-[340px]">
            For your safety, a sign-in lasts 24 hours. Log in again to pick up where you left off.
          </p>
        </div>

        {/* Primary Action Button (Figma EL-02d186dd) */}
        <Button appearance="auth" variant="primary"
          type="button"
          onClick={handleAction}
        >
          Log in again
        </Button>
      </AuthPanel>

      {/* Legal Footer (Figma EL-0b7a78e5) */}
      <LegalFooter />
    </main>
  )
}
