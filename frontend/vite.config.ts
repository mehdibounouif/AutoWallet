import { readFileSync } from 'node:fs'
import { Agent } from 'node:https'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  // These are server-only settings; never expose them through a VITE_ prefix.
  const env = loadEnv(mode, process.cwd(), 'API_PROXY_')
  const target = env.API_PROXY_TARGET || 'https://localhost'
  const caFile = env.API_PROXY_CA_FILE
  const agent = command === 'serve' && target.startsWith('https:') && caFile
    ? new Agent({ ca: readFileSync(resolve(caFile)) })
    : undefined

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: true,
          ...(agent ? { agent } : {}),
        },
      },
    },
  }
})
