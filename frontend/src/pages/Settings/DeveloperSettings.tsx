import { AiKeyCard } from './developer/AiKeyCard'
import { ApiKeysCard } from './developer/ApiKeysCard'

export function DeveloperSettings({ online, onSessionEnded }: {
  online: boolean
  onSessionEnded: () => void
}) {
  return (
    <>
      <AiKeyCard />
      <ApiKeysCard online={online} onSessionEnded={onSessionEnded} />
    </>
  )
}
