import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  server: {
    host: "127.0.0.1",
    port: 4301,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:4300",
        changeOrigin: true
      }
    }
  },
  preview: {
    host: "127.0.0.1",
    port: 4301
  }
});
