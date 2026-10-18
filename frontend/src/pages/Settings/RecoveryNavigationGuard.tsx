import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { Dialog } from '../../components/common/Dialog'
import { readAccessToken } from '../../auth/session'

export function RecoveryNavigationGuard({ pending, hasCodes, onDiscard }: {
  pending: boolean; hasCodes: boolean; onDiscard: () => void
}) {
  const [sessionToken] = useState(readAccessToken)
  const stayRef = useRef<HTMLButtonElement>(null)
  const protectedCodes = pending || hasCodes
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    protectedCodes && sessionToken !== null && sessionToken === readAccessToken() && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (!protectedCodes) return
    const warn = (event: BeforeUnloadEvent) => {
      if (sessionToken !== readAccessToken()) return
      event.preventDefault(); event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [protectedCodes, sessionToken])

  // A failed request with no codes should leave the user on the error screen.
  useEffect(() => {
    if (!protectedCodes && blocker.state === 'blocked') blocker.reset()
  }, [protectedCodes, blocker])

  if (blocker.state !== 'blocked') return null
  return <Dialog labelledBy="leave-recovery-title" role="alertdialog" initialFocusRef={stayRef} onClose={() => blocker.reset()} panelClassName="dashboard-modal">
    <h2 id="leave-recovery-title">{pending ? 'Recovery codes are being prepared' : 'Have you saved your recovery codes?'}</h2>
    <p>{pending ? 'Wait for this request to finish so you can save your codes. Leaving now could lose the new codes even if the account service completes the request.' : 'Leaving this page hides these codes. You won’t be able to display this set again. Stay to copy or download them first.'}</p>
    <div className="settings-actions">
      <button ref={stayRef} type="button" className="dashboard-primary-button" onClick={() => blocker.reset()}>{pending ? 'Stay on this page' : 'Stay and save codes'}</button>
      <button type="button" className="settings-outline-button" disabled={pending} onClick={() => { onDiscard(); blocker.proceed() }}>Leave this page</button>
    </div>
  </Dialog>
}
