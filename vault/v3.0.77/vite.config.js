import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { debugSinkPlugin } from './vite-debug-plugin.js'

export default defineConfig({
  plugins: [react(), debugSinkPlugin()],
})
