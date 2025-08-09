import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    plugins: [react()],
    base: '/',
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      proxy: isDevelopment ? {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      } : {},
    },
  };
});
