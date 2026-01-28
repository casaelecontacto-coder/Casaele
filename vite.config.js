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
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into separate chunks
          if (id.includes("node_modules")) {
            // Firebase - split by module for better caching
            if (id.includes("@firebase") || id.includes("firebase")) {
              if (id.includes("auth")) return "firebase-auth";
              if (id.includes("firestore")) return "firebase-firestore";
              return "firebase-core";
            }

            // React core - separate chunks
            if (id.includes("react-dom")) return "react-dom";
            if (id.includes("react/") || id.includes("react-is") || id.includes("scheduler")) return "react";

            // Large libraries - separate chunks (lazy loaded)
            if (id.includes("recharts") || id.includes("d3-")) return "charts";
            if (id.includes("tinymce")) return "editor";
            if (id.includes("@stripe")) return "stripe";

            // Medium libraries
            if (id.includes("react-router")) return "router";
            if (id.includes("axios")) return "http";
            if (id.includes("react-icons")) return "icons";
            if (id.includes("react-hot-toast")) return "toast";

            // All other vendor code
            return "vendor";
          }

          // Split admin dashboard into its own chunk (lazy loaded)
          if (id.includes("/src/pages/admin/")) return "admin";

          // Split components by feature
          if (id.includes("/src/components/CourseDetail/")) return "course-detail";
          if (id.includes("/src/components/Material/")) return "material";
          if (id.includes("/src/components/Admin/")) return "admin-components";

          return undefined;
        },
      },
    },
  },
});
