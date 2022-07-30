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
      animation: {
        rainbow: "rainbow 25s infinite linear",
      },
      keyframes: {
        rainbow: {
          "0%": {
            "background-color": "#ff000080",
          },
          "10%": {
            "background-color": "#ff800080",
          },
          "20%": {
            "background-color": "#ffff0080",
          },
          "30%": {
            "background-color": "#80ff0080",
          },
          "40%": {
            "background-color": "#00ff0080",
          },
          "50%": {
            "background-color": "#00ff8080",
          },
          "60%": {
            "background-color": "#00ffff80",
          },
          "70%": {
            "background-color": "#0080ff80",
          },
          "80%": {
            "background-color": "#0000ff80",
          },
          "90%": {
            "background-color": "#8000ff80",
          },
          "100%": {
            "background-color": "#ff000080",
          },
        },
      },
    },
    fontFamily: {
      sans: ["Inter", ...defaultTheme.fontFamily.sans],
      mono: ["Source Code Pro", ...defaultTheme.fontFamily.mono],
    },
  },
  plugins: [],
};
