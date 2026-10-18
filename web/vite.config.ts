import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    // 같은 출처로 붙여 세션·CSRF 쿠키가 그대로 동작하게 한다
    proxy: { '/api': 'http://localhost:8080' },
  },
})
