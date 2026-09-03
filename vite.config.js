import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/2026_toy_project_h/",
  plugins: [react()],
  server: {
    // 0.0.0.0 으로 열어 같은 네트워크의 다른 PC에서도 접속할 수 있게 합니다.
    // 예) http://10.23.131.39:5173/2026_toy_project_h/
    host: true,
    port: 5173,
    // /api 로 시작하는 요청은 로컬 API 서버(3001)로 넘깁니다.
    // 브라우저 입장에선 같은 주소라 CORS 문제가 생기지 않습니다.
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
