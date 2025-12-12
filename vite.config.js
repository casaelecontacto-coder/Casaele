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
          // Split node_modules into separate chunks
          if (id.includes("node_modules")) {
            // Firebase modules - split into separate chunk
            if (id.includes("firebase/app") || id.includes("firebase/auth") || id.includes("firebase/firestore") || id.includes("firebase/storage")) {
              return "firebase";
            }
            
            // React and React DOM - separate chunks
            if (id.includes("react-dom")) {
              return "react-dom";
            }
            if (id.includes("react") && !id.includes("react-dom")) {
              return "react";
            }
            
            // Large third-party libraries - separate chunks
            if (id.includes("recharts")) return "charts";
            if (id.includes("tinymce")) return "editor";
            if (id.includes("@stripe")) return "stripe";
            if (id.includes("react-router")) return "router";
            if (id.includes("axios")) return "axios";
            if (id.includes("mongoose")) return "mongoose";
            
            // All other vendor code
            return "vendor";
          }

          // Split admin dashboard into its own chunk
          if (id.includes("/src/pages/admin/")) return "admin";
          
          // Split heavy components into their own chunks
          if (id.includes("/src/components/CourseDetail/")) return "course-detail";
          if (id.includes("/src/components/Material/")) return "material";

          return undefined;
        },
      },
    },
  },
});
