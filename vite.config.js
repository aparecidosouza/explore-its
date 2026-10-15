
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

export default defineConfig(({ command }) => ({
  base: '/explore-its/',

  server: command === 'serve'
    ? {
        host: '0.0.0.0',
        https: {
          key: readFileSync('./certificados/local-key.pem'),
          cert: readFileSync('./certificados/local.pem'),
        },
      }
    : undefined,
}))
