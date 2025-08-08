import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to replace localhost
const replaceLocalhostPlugin = () => ({
  name: 'replace-localhost',
  transform(code, id) {
    if (id.includes('node_modules')) return null; // Don't transform node_modules
    const newCode = code.replace(/http:\/\/localhost/g, 'https://locehpad-backend.onrender.com');
    if (newCode !== code) {
      console.log(`Replaced localhost in ${id}`);
      return { code: newCode, map: null }; // Return transformed code
    }
    return null;
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), replaceLocalhostPlugin()],
  base: '/', // Ensure base path is root
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify("https://locehpad-backend.onrender.com"),
  },
})
