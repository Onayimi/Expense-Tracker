import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Custom colour palette based on brand identity ──────────────────
      colors: {
        // Deep forest green — primary brand colour (navbar, headings, dark accents)
        forest: {
          DEFAULT: "#0C3B2C",
          50:  "#E6F2EE",
          100: "#C0DECE",
          200: "#97C8B0",
          300: "#6DB290",
          400: "#449970",
          500: "#0C3B2C",
          600: "#0A3326",
          700: "#082A1E",
          800: "#052017",
          900: "#031510",
        },
        // Amber gold — call-to-action buttons, active states, highlights
        gold: {
          DEFAULT: "#F0A020",
          50:  "#FEF8EC",
          100: "#FDECC8",
          200: "#FBD98E",
          300: "#F8C554",
          400: "#F5B328",
          500: "#F0A020",
          600: "#D48A12",
          700: "#A86C0D",
          800: "#7C4F08",
          900: "#503304",
        },
        // Light mint — backgrounds, success tints, secondary highlights
        mint: {
          DEFAULT: "#CBF0E4",
          50:  "#F0FBF7",
          100: "#D8F5EA",
          200: "#CBF0E4",
          300: "#9FE0CB",
          400: "#6CCFB0",
          500: "#3DBD94",
          600: "#2A9576",
          700: "#1F7059",
          800: "#144B3B",
          900: "#0A2B22",
        },
        // Crimson — warnings, danger, "hubby owes" alerts
        crimson: {
          DEFAULT: "#CC1F1F",
          50:  "#FEF0F0",
          100: "#FBCCCC",
          200: "#F79999",
          300: "#F36666",
          400: "#EF3333",
          500: "#CC1F1F",
          600: "#A81818",
          700: "#821212",
          800: "#5C0D0D",
          900: "#380808",
        },
      },

      // ── Custom font ────────────────────────────────────────────────────
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
