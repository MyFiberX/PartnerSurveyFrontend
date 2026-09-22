import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: {
    /**
     * The API's Cors:AllowedOrigins lists only http://localhost:5174, and its
     * policy uses AllowCredentials(), so a wildcard origin is not an option.
     * strictPort makes a taken port fail loudly here rather than silently
     * falling back to 5173, whose requests the API rejects at CORS.
     */
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
