import { useEffect, useState } from 'react'
import { KeyRound, Plus, Trash2 } from 'lucide-react'
import { SettingsApiError, createApiKey, fetchApiKeys, revokeApiKey } from '../../../api/settingsApi'
import type { ApiKeyItem } from '../../../api/settingsApi'
import { Button } from '../../../components/ui/Button'
import { Field, Input } from '../../../components/ui/Field'
import { SettingsCard, SettingsForm } from '../SettingsCard'
import { CodeBlock } from './CodeBlock'

/** Personal API keys and the sample authenticated request. */
export function ApiKeysCard({ online, onSessionEnded }: {
  online: boolean
  onSessionEnded: () => void
}) {
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [loading, setLoading] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<string | null>(null)

  useEffect(() => {
    if (!online) return
    const controller = new AbortController()
    queueMicrotask(() => {
      if (controller.signal.aborted) return
      setLoading(true)
      fetchApiKeys(controller.signal)
        .then((items) => { if (!controller.signal.aborted) setKeys(items) })
        .catch((reason) => {
          if (controller.signal.aborted) return
          if (reason instanceof SettingsApiError && reason.status === 401) onSessionEnded()
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    })
    return () => controller.abort()
  }, [online, onSessionEnded])

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setError('Enter a descriptive name for your API key.')
      return
    }
    setCreating(true)
    setError(null)
    setNewKey(null)
    try {
      const created = await createApiKey(trimmed)
      setKeys((previous) => [created, ...previous])
      setNameDraft('')
      if (created.secret_key) setNewKey(created.secret_key)
    } catch (reason) {
      if (reason instanceof SettingsApiError && reason.status === 401) {
        onSessionEnded()
        return
      }
      setError(reason instanceof Error ? reason.message : 'Could not create API key.')
    } finally {
      setCreating(false)
    }
  }

  const revoke = async (id: string) => {
    try {
      await revokeApiKey(id)
      setKeys((previous) => previous.filter((item) => item.id !== id))
    } catch (reason) {
      if (reason instanceof SettingsApiError && reason.status === 401) {
        onSessionEnded()
        return
      }
      setError(reason instanceof Error ? reason.message : 'Could not revoke API key.')
    }
  }

  const curlExample = `curl -X POST ${window.location.origin}/api/transactions/ \\
  -H "Authorization: Bearer <your_access_or_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"reference":"INV-2026-048","amount":8500}'`

  return (
    <SettingsCard
      title="Personal API keys"
      description="Create personal API keys to record incoming client payments or query your envelopes programmatically."
    >
      <SettingsForm onSubmit={(event) => void create(event)} noValidate>
        <Field label="New API key name" htmlFor="new-api-key-name" error={error}>
          <Input
            id="new-api-key-name"
            value={nameDraft}
            onChange={(event) => { setNameDraft(event.target.value); setError(null) }}
            placeholder="e.g. Invoicing webhook"
            maxLength={60}
            disabled={!online || creating}
          />
        </Field>
        <Button type="submit" disabled={!online || creating || !nameDraft.trim()} loading={creating} icon={<Plus className="size-4" aria-hidden="true" />} className="justify-self-start">
          {creating ? 'Creating…' : 'Create API key'}
        </Button>
      </SettingsForm>

      {newKey && (
        <div role="status">
          <CodeBlock label="Copy your new API key now — it won't be shown again" code={newKey} />
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-xs text-muted">Loading API keys…</p>
      ) : keys.length === 0 ? (
        <div className="mt-4 flex items-center gap-3.5 rounded-xl border border-line px-4 py-5 text-muted">
          <KeyRound className="size-5 shrink-0" aria-hidden="true" />
          <div>
            <strong className="text-[13px] font-semibold text-ink">No personal API keys yet</strong>
            <p className="mt-1.5 text-xs leading-relaxed">
              Create a personal key above to authenticate external scripts or invoice webhooks without exposing your browser session.
            </p>
          </div>
        </div>
      ) : (
        <dl className="mt-4 text-xs" aria-label="Personal API keys">
          {keys.map((keyItem) => (
            <div key={keyItem.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5 max-md:flex-col max-md:gap-2">
              <dt className="shrink-0">
                <strong className="text-body">{keyItem.name}</strong>
                <span className="ms-2 font-mono text-xs text-muted">{keyItem.prefix}</span>
              </dt>
              <dd className="flex items-center gap-3 max-md:text-start">
                <span className="text-2xs text-muted">
                  Created {new Date(keyItem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Button
                  variant="danger-outline"
                  size="sm"
                  onClick={() => void revoke(keyItem.id)}
                  disabled={!online}
                  aria-label={`Revoke ${keyItem.name}`}
                  icon={<Trash2 className="size-3.5" aria-hidden="true" />}
                >
                  Revoke
                </Button>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 border-t border-line pt-4.5">
        <h3 className="font-mono text-[13px] font-semibold text-ink">POST /api/transactions/</h3>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Authenticated requests with your personal API key or Bearer token record a payment and run your active envelope rules.
        </p>
        <CodeBlock label="cURL example" code={curlExample} />
      </div>
    </SettingsCard>
  )
}
