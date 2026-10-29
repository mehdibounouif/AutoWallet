import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { SettingsCard } from '../SettingsCard'
import { DeleteAccountDialog } from './DeleteAccountDialog'

export function DeleteAccountCard({ email, online, onSessionEnded, onDeleted }: {
  email: string
  online: boolean
  onSessionEnded: () => void
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <SettingsCard
      title="Delete your account"
      description="Deletes your envelopes, rules and payment history for good. This can’t be undone."
    >
      <Button
        variant="danger"
        className="mt-5"
        onClick={() => setOpen(true)}
        disabled={!online}
        icon={<Trash2 className="size-4" aria-hidden="true" />}
      >
        Delete account
      </Button>
      {open && (
        <DeleteAccountDialog
          email={email}
          online={online}
          onClose={() => setOpen(false)}
          onSecureExport={() => setOpen(false)}
          onSessionEnded={onSessionEnded}
          onDeleted={onDeleted}
        />
      )}
    </SettingsCard>
  )
}
