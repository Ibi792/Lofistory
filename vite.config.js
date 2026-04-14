import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createHandler } from './api/spotify.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'spotify-proxy',
        configureServer(server) {
          const handle = createHandler({
            clientId:     env.VITE_SPOTIFY_CLIENT_ID,
            clientSecret: env.VITE_SPOTIFY_CLIENT_SECRET,
          })
          server.middlewares.use('/api/spotify', handle)
        },
      },
    ],
  }
})
