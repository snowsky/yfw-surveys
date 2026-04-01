import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_SURVEYS_PREFIX": JSON.stringify("/api/v1/surveys"),
    "import.meta.env.VITE_SURVEYS_PUBLIC_PREFIX": JSON.stringify("/api/v1/surveys/public"),
    "import.meta.env.VITE_USE_SETUP": JSON.stringify("true"),
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../plugin/ui/shared"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
});
