import { Button } from '../../components/ui/Button'
import { useRef } from 'react'
import { Dialog } from '../../components/common/Dialog'
import { useNavigationProtection } from '../../hooks/navigationProtection'

export function RecoveryNavigationGuard({ pending, hasCodes, onDiscard, pendingAction = 'generate' }: {
  pending: boolean; hasCodes: boolean; onDiscard: () => void; pendingAction?: 'generate' | 'disable'
}) {
  const stayRef = useRef<HTMLButtonElement>(null)
  const protectedCodes = pending || hasCodes
  const blocker = useNavigationProtection(protectedCodes, pending)

  if (blocker?.state !== 'blocked') return null
  return <Dialog labelledBy="leave-recovery-title" role="alertdialog" initialFocusRef={stayRef} onClose={() => blocker.reset()} panelClassName="dashboard-modal">
    <h2 id="leave-recovery-title">{pending ? pendingAction === 'disable' ? 'Two-factor login is being updated' : 'Recovery codes are being prepared' : 'Have you saved your recovery codes?'}</h2>
    <p>{pending ? pendingAction === 'disable' ? 'Wait for this request to finish before leaving. Your authenticator and recovery codes may be disabled when it completes.' : 'Wait for this request to finish so you can save your codes. Leaving now could lose the new codes even if the account service completes the request.' : 'Leaving this page hides these codes. You won’t be able to display this set again. Stay to copy or download them first.'}</p>
    <div className="settings-actions">
      <Button variant="primary" ref={stayRef} type="button" className="dashboard-primary-button" onClick={() => blocker.reset()}>{pending ? 'Stay on this page' : 'Stay and save codes'}</Button>
      <Button variant="outline" type="button" className="settings-outline-button" disabled={pending} onClick={() => { onDiscard(); blocker.proceed() }}>Leave this page</Button>
    </div>
  </Dialog>
}
