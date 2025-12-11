/** @type {import('tailwindcss').Config} */
export default {
  // 👇 Purge all unused styles (BIG CSS size reduction)
  content: [
    "./index.html",
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
    },
  },

  plugins: [
    // Add plugins here if needed later (forms, typography, etc.)
    // require("@tailwindcss/forms"),
    // require("@tailwindcss/typography"),
    // require("@tailwindcss/aspect-ratio"),
  ],
};
