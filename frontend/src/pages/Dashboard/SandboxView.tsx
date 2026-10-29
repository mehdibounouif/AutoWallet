import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { DashboardData } from './dashboardApi'
import { previewPayment } from './dashboardSplit'
import { parseAmount } from '../../utils/format'
import { useTranslation } from '../../i18n'
import { Alert } from '../../components/ui/Alert'
import { Page } from '../../components/ui/Page'
import { PageHeader } from '../../components/ui/PageHeader'
import { SandboxForm } from './SandboxForm'
import { SandboxPreview } from './SandboxPreview'

const isPositiveAmount = (value: number) => Number.isFinite(value) && value > 0

export function SandboxView({ data }: { data: DashboardData }) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('12,000.00')
  const [reference, setReference] = useState('TEST-001')
  const [settled, setSettled] = useState(amount)
  const [simulated, setSimulated] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(amount), 500)
    return () => clearTimeout(timer)
  }, [amount])

  const value = parseAmount(settled)
  const result = previewPayment(value, data.rules, data.wallets)
  const updating = settled !== amount
  const inputValid = isPositiveAmount(parseAmount(amount))
  const inputInvalid = submitted && !inputValid

  const submit = () => {
    setSubmitted(true)
    setSettled(amount)
    setSimulated(inputValid)
  }

  return (
    <Page>
      <PageHeader title={t.sandboxHeading} description={t.sandboxSubheading} />

      <SandboxForm
        amount={amount}
        reference={reference}
        invalid={inputInvalid}
        onAmountChange={(next) => { setAmount(next); setSimulated(false) }}
        onReferenceChange={setReference}
        onSubmit={submit}
      />

      {simulated && (
        <Alert tone="success" icon={<Check className="size-[17px]" />} className="mt-5 max-w-[900px]">
          {t.simulationCompleteBanner}
        </Alert>
      )}

      <SandboxPreview
        amount={value}
        reference={reference}
        updating={updating}
        result={result}
      />
    </Page>
  )
}
