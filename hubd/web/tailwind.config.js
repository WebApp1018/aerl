// tailwind.config.js
const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        link: "#F5A524",
        selection: "#FEF5E7",

        primary: "#F5A524",
        primaryLight: "#2E281B",
        primaryLightHover: "#393222",
        primaryLightActive: "#FDEFD8",
        primaryLightContrast: "#B97509",
        primaryBorder: "#F9CB80",
        primaryBorderHover: "#F5A524",
        primarySolidHover: "#B97509",
        primarySolidContrast: "#fff",
        primaryShadow: "#F9CB80"
      }
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};