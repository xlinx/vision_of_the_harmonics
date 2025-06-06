import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8888,
    open: true,
    host: "0.0.0.0",
    allowedHosts:['xmax.local','localhost','xmax'],

  }
})
