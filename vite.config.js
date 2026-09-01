import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/2026_toy_project_h/",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
