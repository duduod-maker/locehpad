import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure base path is root
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify("https://locehpad-backend.onrender.com"),
  },
})
