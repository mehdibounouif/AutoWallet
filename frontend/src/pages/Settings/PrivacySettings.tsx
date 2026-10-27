import type { SecurityInfo } from '../../api/settingsApi'
import { DataExportCard } from './privacy/DataExportCard'
import { DataRetentionCard } from './privacy/DataRetentionCard'
import { DeleteAccountCard } from './privacy/DeleteAccountCard'

interface PrivacySettingsProps {
  email: string
  online: boolean
  onSecurityInfo: (info: SecurityInfo) => void
  onSessionEnded: () => void
  onDeleted: () => void
}

export function PrivacySettings({ email, online, onSecurityInfo, onSessionEnded, onDeleted }: PrivacySettingsProps) {
  return (
    <>
      <DataExportCard online={online} onSecurityInfo={onSecurityInfo} onSessionEnded={onSessionEnded} />
      <DataRetentionCard />
      <DeleteAccountCard email={email} online={online} onSessionEnded={onSessionEnded} onDeleted={onDeleted} />
    </>
  )
}
