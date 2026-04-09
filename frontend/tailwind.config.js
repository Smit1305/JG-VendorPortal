/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Modernize theme primary colors (Blue_Theme)
        primary: {
          DEFAULT: "#5d87ff",
          light: "#ebf3fe",
          dark: "#4570ea",
          50: "#ebf3fe",
          100: "#d6e8fd",
          200: "#aed1fb",
          300: "#85baf9",
          400: "#5d87ff",
          500: "#4570ea",
          600: "#3a5bc7",
          700: "#2f47a4",
          800: "#243381",
          900: "#19205e",
        },
        secondary: {
          DEFAULT: "#49beff",
          light: "#e8f7ff",
        },
        success: {
          DEFAULT: "#13deb9",
          light: "#e6fffa",
        },
        warning: {
          DEFAULT: "#ffae1f",
          light: "#fef5e5",
        },
        danger: {
          DEFAULT: "#fa896b",
          light: "#fdede8",
        },
        info: {
          DEFAULT: "#49beff",
          light: "#e8f7ff",
        },
        // Sidebar exact colors from Modernize
        sidebar: {
          bg: "#2a3547",
          hover: "#253662",
          active: "#5d87ff",
          text: "#7c8fac",
          border: "#3a4a5c",
          logo: "#1e2a3a",
        },
        // Body background
        body: "#f6f9fc",
        // Card
        card: "#ffffff",
        // Border
        border: "#e5eaef",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Figtree", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0px 7px 30px 0px rgba(90,114,123,0.11)",
        "card-sm": "0px 2px 6px 0px rgba(90,114,123,0.08)",
      },
      borderRadius: {
        card: "7px",
      },
      textColor: {
        info: "#49beff",
        success: "#13deb9",
        warning: "#ffae1f",
        danger: "#fa896b",
        primary: "#5d87ff",
        secondary: "#49beff",
      },
      backgroundColor: {
        info: "#49beff",
        success: "#13deb9",
        warning: "#ffae1f",
        danger: "#fa896b",
        primary: "#5d87ff",
      },
      borderColor: {
        primary: "#5d87ff",
        info: "#49beff",
        success: "#13deb9",
        warning: "#ffae1f",
        danger: "#fa896b",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
