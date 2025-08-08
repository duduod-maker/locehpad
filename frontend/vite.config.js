import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_BASE_URL': JSON.stringify("https://locehpad-backend.onrender.com"),
    'http://localhost': JSON.stringify("https://locehpad-backend.onrender.com"),
  },
})
