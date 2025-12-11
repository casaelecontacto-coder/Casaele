import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  publicDir: 'src/public',
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp'],
  base: "/",

  build: {
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase";
            if (id.includes("recharts")) return "charts";
            if (id.includes("tinymce")) return "editor";
            if (id.includes("@stripe")) return "stripe";
            if (id.includes("react-router")) return "router";
            if (id.includes("react-dom")) return "react-dom";
            if (id.includes("react")) return "react";

            return "vendor";
          }

          // Split admin dashboard into its own chunk
          if (id.includes("/src/pages/admin/")) return "admin";

          return undefined;
        },
      },
    },
  },
});
