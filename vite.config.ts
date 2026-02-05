import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer'
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws'
    }
  }
})
