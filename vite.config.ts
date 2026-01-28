import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// PUBLIC_INTERFACE
export default defineConfig({
  /** Vite configuration for the modernized web client. */
  plugins: [vue()],
  server: {
    port: 3003,
    host: true
  },
  preview: {
    port: 3003,
    host: true
  }
})
