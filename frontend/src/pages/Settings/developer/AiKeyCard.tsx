import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { getStoredAiConfig, saveStoredAiConfig } from '../../../api/assistantApi'
import type { AiConfig } from '../../../api/assistantApi'
import { Alert } from '../../../components/ui/Alert'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Field, Input, RevealInput } from '../../../components/ui/Field'
import { SettingsCard, SettingsForm } from '../SettingsCard'

/** Locally stored AI provider configuration for the Assistant. */
export function AiKeyCard() {
  const [config, setConfig] = useState<AiConfig | null>(() => getStoredAiConfig())
  const [keyDraft, setKeyDraft] = useState(() => getStoredAiConfig()?.apiKey || '')
  const [modelDraft, setModelDraft] = useState(() => getStoredAiConfig()?.model || '')
  const [baseUrlDraft, setBaseUrlDraft] = useState(() => getStoredAiConfig()?.baseUrl || '')
  const [showKey, setShowKey] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const save = () => {
    if (!keyDraft.trim()) {
      saveStoredAiConfig(null)
      setConfig(null)
      setNotice('AI API key removed.')
      return
    }
    const next: AiConfig = {
      apiKey: keyDraft.trim(),
      model: modelDraft.trim() || undefined,
      baseUrl: baseUrlDraft.trim() || undefined,
    }
    saveStoredAiConfig(next)
    setConfig(next)
    setNotice('AI assistant key saved successfully! The Assistant can now answer your questions.')
  }

  const remove = () => {
    saveStoredAiConfig(null)
    setConfig(null)
    setKeyDraft('')
    setModelDraft('')
    setBaseUrlDraft('')
    setNotice('AI API key removed.')
  }

  return (
    <SettingsCard
      title="AI Assistant API key"
      description="Configure your Gemini or OpenAI API key directly here so the Assistant can answer questions about your money, active rules, and envelope balances."
      action={
        <Badge tone={config?.apiKey ? 'success' : 'neutral'} icon={config?.apiKey ? <Check className="size-3" aria-hidden="true" /> : <Sparkles className="size-3" aria-hidden="true" />}>
          {config?.apiKey ? 'Configured' : 'Not configured'}
        </Badge>
      }
    >
      {notice && <Alert tone="success" className="mt-4">{notice}</Alert>}

      <SettingsForm onSubmit={(event) => { event.preventDefault(); save() }}>
        <Field
          label="API key"
          htmlFor="settings-ai-key"
          hint={<>Supports Google Gemini (starts with <code className="font-mono">AIzaSy</code>) or OpenAI (starts with <code className="font-mono">sk-</code>). Stored locally in your browser.</>}
        >
          <RevealInput
            id="settings-ai-key"
            revealed={showKey}
            onToggleReveal={() => setShowKey((value) => !value)}
            toggleLabel={showKey ? 'Hide API key' : 'Show API key'}
            value={keyDraft}
            onChange={(event) => setKeyDraft(event.target.value)}
            placeholder="e.g. AIzaSy... or sk-..."
            autoComplete="off"
            spellCheck={false}
            className="pr-11 font-mono text-xs"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Model (optional)" htmlFor="settings-ai-model">
            <Input
              id="settings-ai-model"
              value={modelDraft}
              onChange={(event) => setModelDraft(event.target.value)}
              placeholder={keyDraft.startsWith('sk-') ? 'gpt-4o-mini' : 'gemini-1.5-flash'}
            />
          </Field>
          <Field label="Base URL (optional)" htmlFor="settings-ai-url">
            <Input
              id="settings-ai-url"
              value={baseUrlDraft}
              onChange={(event) => setBaseUrlDraft(event.target.value)}
              placeholder={keyDraft.startsWith('sk-') ? 'https://api.openai.com/v1' : 'https://generativelanguage.googleapis.com/v1beta/openai'}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!keyDraft.trim()}>Save AI key</Button>
          {config?.apiKey && <Button variant="danger-outline" onClick={remove}>Remove key</Button>}
        </div>
      </SettingsForm>
    </SettingsCard>
  )
}
