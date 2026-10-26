import { useEffect, useState } from 'react'

// Generate the QR locally: an authenticator secret must never be sent to an image service.
export function AuthenticatorCode({ uri }: { uri: string }) {
  const [graphic, setGraphic] = useState<{ size: number; path: string } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    if (!uri) {
      queueMicrotask(() => { if (active) setFailed(true) })
      return () => { active = false }
    }
    void import('qrcode-generator').then(({ default: qrcode }) => {
      const qr = qrcode(0, 'M')
      qr.addData(uri)
      qr.make()
      const count = qr.getModuleCount()
      const paths: string[] = []
      for (let row = 0; row < count; row++) {
        for (let column = 0; column < count; column++) {
          if (qr.isDark(row, column)) paths.push(`M${column + 4} ${row + 4}h1v1h-1z`)
        }
      }
      if (active) setGraphic({ size: count + 8, path: paths.join('') })
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [uri])

  return (
    <div className="mt-3.5 grid size-[196px] max-w-full place-items-center rounded-xl border border-line bg-white p-1.5 text-center text-xs text-muted">
      {graphic ? (
        <svg
          viewBox={`0 0 ${graphic.size} ${graphic.size}`}
          className="block size-full"
          role="img"
          aria-label="Authenticator setup QR code. You can also enter the setup key below."
          shapeRendering="crispEdges"
        >
          <rect width={graphic.size} height={graphic.size} fill="white" />
          <path d={graphic.path} fill="#17212e" />
        </svg>
      ) : (
        <span role="status">{failed ? 'Use the setup key below.' : 'Preparing QR code…'}</span>
      )}
    </div>
  )
}
