import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8787',
      '/me': 'http://localhost:8787',
      '/pages': 'http://localhost:8787',
      '/admin': 'http://localhost:8787',
      '/health': 'http://localhost:8787',
    },
  },
})
