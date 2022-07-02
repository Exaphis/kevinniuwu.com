/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        accent: "#D9A629",
        background: "#08122B",
        text: "#CCCCCC",
      },
      spacing: {
        112: "28rem",
      },
    },
    fontFamily: {
      sans: ["Inter", ...defaultTheme.fontFamily.sans],
      mono: ["Source Code Pro", ...defaultTheme.fontFamily.mono],
    },
  },
  plugins: [],
};
