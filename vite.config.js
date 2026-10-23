
import { defineConfig } from 'vite'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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

  plugins: [
    {
      name: 'explore-its-offline-assets',
      closeBundle() {
        const pasta = 'dist/assets'
        const arquivos = readdirSync(pasta)
          .filter(nome => /\.(js|css)$/.test(nome))
          .map(nome => `assets/${nome}`)

        writeFileSync(
          join('dist', 'offline-assets.json'),
          JSON.stringify(arquivos, null, 2)
        )
      },
    },
  ],
}))
