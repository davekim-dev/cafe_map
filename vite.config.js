import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 카카오 콘솔에 http://localhost:5173 만 등록되어 있어서 항상 5173번으로 켜요.
    // strictPort: 5173이 이미 쓰이는 중이면 다른 번호(5174 등)로 몰래 바꾸지 않고 에러를 내요.
    // → "Port 5173 is already in use" 가 나오면 이미 켜진 개발 서버(다른 터미널)를 먼저 끄세요.
    port: 5173,
    strictPort: true,
  },
})
