import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep forest green — primary brand
        forest: {
          DEFAULT: "#123227",
          50:  "#EBF2EF",
          100: "#C7DDD5",
          200: "#99C0B3",
          300: "#6AA38F",
          400: "#3D876C",
          500: "#123227",
          600: "#0F2A21",
          700: "#0B221A",
          800: "#081A14",
          900: "#05110D",
        },
        // Gold/amber — CTA, highlights
        gold: {
          DEFAULT: "#D9A11E",
          50:  "#FDF6E3",
          100: "#FAE8B4",
          200: "#F6D980",
          300: "#F2CB4D",
          400: "#EDBD26",
          500: "#D9A11E",
          600: "#B88519",
          700: "#8F6813",
          800: "#664B0E",
          900: "#3D2E09",
        },
        // Light sage — backgrounds, borders
        sage: {
          DEFAULT: "#C6D4D2",
          50:  "#F4F8F7",
          100: "#E4EDEC",
          200: "#C6D4D2",
          300: "#A8BBBA",
          400: "#8AA3A1",
          500: "#6C8B88",
          600: "#567370",
          700: "#415957",
          800: "#2C3E3D",
          900: "#182323",
        },
        // Off-white — page background
        offwhite: "#EEF4F3",
        // Accent red
        crimson: {
          DEFAULT: "#C62828",
          50:  "#FEECEC",
          100: "#FAC5C5",
          200: "#F59999",
          300: "#EF6B6B",
          400: "#E94040",
          500: "#C62828",
          600: "#A31F1F",
          700: "#801818",
          800: "#5C1212",
          900: "#380B0B",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont",
          "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      screens: {
        xs: "375px",
      },
    },
  },
  plugins: [],
};

export default config;
