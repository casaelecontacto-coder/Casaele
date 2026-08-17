/** @type {import('tailwindcss').Config} */
export default {
  // 👇 Purge all unused styles (BIG CSS size reduction)
  content: [
    "./index.html",
    "./app.html",
    "./src/**/*.{js,ts,jsx,tsx}",   // Your components, pages, layouts
  ],

  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },

    extend: {
      // Add your custom colors, animations, etc. here
      colors: {
        casa: {
          cream: "#f5e6d3",
          creamLight: "#fbf4e9",
          ink: "#17110e",
          red: "#a91f24",
          redDark: "#8c1a1e",
          redShadow: "#6f1216",
          gold: "#d9a664",
        },
      },
      fontFamily: {
        heading: ["'Zen Maru Gothic'", "system-ui", "sans-serif"],
        body: ["'Host Grotesk'", "system-ui", "sans-serif"],
      },
    },
  },

  plugins: [
    // Add plugins here if needed later (forms, typography, etc.)
    // require("@tailwindcss/forms"),
    // require("@tailwindcss/typography"),
    // require("@tailwindcss/aspect-ratio"),
  ],
};
