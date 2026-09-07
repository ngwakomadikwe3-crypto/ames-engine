import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        ringViewer: 'ring-viewer.html',
        diamondReference: 'diamond-reference.html',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
})
