import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";

// Reticle (@reticlehq/vite-plugin) is a browser phone-frame preview tool.
// Disabled here so production builds and Capacitor device runs are full-screen.
// Re-enable locally by wrapping react() with reticle({ port: 3000 }) if needed.
export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    host: "0.0.0.0",
    port: 5175,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      // Static uploads served by the backend at root /uploads (not under /api)
      "/uploads": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
});
