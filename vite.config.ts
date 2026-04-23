import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Dev-only proxy: requests from the dashboard to /api/* get forwarded
      // to the FastAPI backend on localhost:8000. This sidesteps CORS during
      // local dev and lets the same fetch code work in production (where
      // app.componentwatch.com calls api.componentwatch.com directly).
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
        },
      },
    },
  }
})
