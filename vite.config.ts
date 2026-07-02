import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 프론트(5173) → 백엔드(FastAPI 8000). /api 프리픽스를 프록시로 넘긴다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true,
                rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
});
