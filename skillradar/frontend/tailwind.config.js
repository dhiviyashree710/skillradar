/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0C0F1C",
        ink2: "#141A2E",
        paper: "#F7F5EF",
        paper2: "#EEEAE0",
        teal: "#35D0B5",
        amber: "#FFB020",
        coral: "#FF5D5D",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
