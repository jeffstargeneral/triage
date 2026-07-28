/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F5F2EA",
        bgAlt: "#EFEBE0",
        surface: "#FFFFFF",
        surfaceTint: "#FBF9F4",
        clay: "#D97757",
        clayDark: "#B85C3F",
        clayTint: "#F3E3DA",
        ink: "#2C2B27",
        inkDim: "#6B6A63",
        inkFaint: "#9B9A91",
        urgent: "#D97757",
        routine: "#5A7A3E",
        spam: "#9B9A91",
        waiting: "#6B5A9E",
        waitingTint: "#E9E6F2",
      },
      fontFamily: {
        serif: ["Source Serif 4", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderColor: {
        DEFAULT: "rgba(44,43,39,0.10)",
      },
    },
  },
  plugins: [],
};
