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
        navy: {
          deep: "#0A1930",
          primary: "#102747",
          secondary: "#1C3557",
          light: "#2B466D",
        },
        ivory: {
          DEFAULT: "#F7F4EC",
          light: "#FCFAF6",
          dark: "#EDE8DC",
        },
        neutral: {
          warm: "#EEE9DE",
          text: "#202C3B",
          muted: "#737985",
          border: "#DCD6CA",
        },
        brass: {
          DEFAULT: "#AC925B",
          light: "#C5AD78",
          dark: "#8D7544",
        },
        academic: {
          success: "#355C48",
          error: "#A94343",
          warning: "#A36829",
          info: "#214D72",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Cormorant Garamond", "Libre Baskerville", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "Source Sans 3", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(10, 25, 48, 0.05), 0 1px 2px rgba(10, 25, 48, 0.03)",
        card: "0 4px 12px rgba(10, 25, 48, 0.04), 0 1px 3px rgba(10, 25, 48, 0.02)",
        elevation: "0 10px 25px -5px rgba(10, 25, 48, 0.08), 0 8px 10px -6px rgba(10, 25, 48, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
