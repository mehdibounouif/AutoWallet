import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { TopBar } from '../../components/layout/TopBar'
import { AuthShell } from '../../components/layout/AuthShell'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { FormCard } from '../../components/ui/FormCard'
import { apiFetch } from '../../api/request'
import { apiErrorDetail } from '../../api/errors'
import { clearGoogleReturnPath, loginPath, readGoogleReturnPath } from '../../auth/returnPath'
import { setToken } from '../../auth/session'

interface ExchangeResult {
  ok: boolean
  data: { access_token?: unknown; detail?: unknown }
}

export function GoogleCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [returnPath] = useState(readGoogleReturnPath)
  const exchangeRef = useRef<{ code: string; promise: Promise<ExchangeResult> } | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const email = searchParams.get('email')
    const status = searchParams.get('status')

    if (error === 'access_denied' || error === 'cancelled' || status === 'cancelled') {
      clearGoogleReturnPath()
      navigate(`${loginPath(returnPath)}&google_status=cancelled`, { replace: true })
      return
    }

    if (status === 'existing_password') {
      const emailQuery = email ? `&email=${encodeURIComponent(email)}` : ''
      clearGoogleReturnPath()
      navigate(`${loginPath(returnPath)}&google_status=existing_password${emailQuery}`, { replace: true })
      return
    }

    if (!code) {
      clearGoogleReturnPath()
      navigate(loginPath(returnPath), { replace: true })
      return
    }

    let isMounted = true

    // Reuse the one-time code exchange when Strict Mode reruns this effect.
    if (exchangeRef.current?.code !== code) {
      exchangeRef.current = {
        code,
        promise: apiFetch('/api/auth/oauth/google/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }).then(async (response) => ({ ok: response.ok, data: await response.json().catch(() => ({})) })),
      }
    }

    const exchangeCode = async () => {
      try {
        const result = await exchangeRef.current!.promise
        if (!isMounted) return

        if (result.ok) {
          if (typeof result.data.access_token !== 'string') throw new Error('Missing access token')
          setToken(result.data.access_token)
          clearGoogleReturnPath()
          navigate(returnPath, { replace: true })
          return
        }

        const detail = apiErrorDetail(result.data, '').message.toLowerCase()
        if (detail.includes('already has a password') || detail.includes('existing')) {
          const emailQuery = email ? `&email=${encodeURIComponent(email)}` : ''
          clearGoogleReturnPath()
          navigate(`${loginPath(returnPath)}&google_status=existing_password${emailQuery}`, { replace: true })
        } else {
          setErrorMessage(t.googleSignInFailed)
        }
      } catch {
        if (isMounted) setErrorMessage(t.serviceUnavailable)
      }
    }

    void exchangeCode()
    return () => { isMounted = false }
  }, [navigate, returnPath, searchParams, t.googleSignInFailed, t.serviceUnavailable])

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas">
      <TopBar />
      <AuthShell footer={false}>
        <FormCard className="flex flex-col items-center p-8 text-center sm:p-10">
          {errorMessage ? (
            <>
              <Alert tone="danger" className="mb-6 w-full text-start" icon={<AlertCircle className="size-5" />}>
                {errorMessage}
              </Alert>
              <div className="flex w-full flex-col gap-2.5">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full font-medium"
                  onClick={() => { clearGoogleReturnPath(); navigate(loginPath(returnPath)) }}
                >
                  {t.loginButton}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <span role="status" aria-label={t.googleSigningIn} className="mb-4 grid size-12 place-items-center rounded-full bg-action-primary-subtle">
                <Loader2 className="size-6 animate-spin text-action-primary" aria-hidden="true" />
              </span>
              <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">{t.googleSigningIn}</h1>
              <p className="max-w-[320px] text-[15px] leading-relaxed text-muted">{t.loginSubtitle}</p>
            </div>
          )}
        </FormCard>
      </AuthShell>
    </div>
  )
}
