import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: '/',
    proxy: {
      /** 백엔드(기본 5000)가 꺼 있으면 이 프록시가 502를 반환할 수 있음. API는 기본적으로 직접 5000으로 호출(auth.js). */
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
