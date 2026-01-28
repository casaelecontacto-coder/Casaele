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
            // Keep React together (don't split - causes issues)
            if (id.includes("react-dom")) return "react-dom";
            if (id.includes("react")) return "react";

            // Firebase in one chunk
            if (id.includes("@firebase") || id.includes("firebase")) return "firebase";

            // Large libraries - separate chunks
            if (id.includes("recharts") || id.includes("d3-")) return "charts";
            if (id.includes("tinymce")) return "editor";
            if (id.includes("@stripe")) return "stripe";

            // All other vendor code
            return "vendor";
          }

          // Split admin dashboard into its own chunk
          if (id.includes("/src/pages/admin/")) return "admin";

          // Split heavy components
          if (id.includes("/src/components/CourseDetail/")) return "course-detail";
          if (id.includes("/src/components/Material/")) return "material";

          return undefined;
        },
      },
    },
  },
});
