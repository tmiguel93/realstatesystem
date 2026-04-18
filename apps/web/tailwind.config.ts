import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "sans-serif"],
        sans: ["Manrope", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef8f5",
          100: "#d7eee6",
          200: "#b1dfcf",
          300: "#84c8b0",
          400: "#56ab8d",
          500: "#2e8b6e",
          600: "#226d57",
          700: "#1e5646",
          800: "#1b4539",
          900: "#183930"
        },
        ink: {
          50: "#f6f7f7",
          100: "#e9ebeb",
          200: "#d1d8d8",
          300: "#a9b6b5",
          400: "#7a8c8b",
          500: "#5f6f6d",
          600: "#4b5858",
          700: "#404a4b",
          800: "#363d3e",
          900: "#2b3031",
          950: "#17211f"
        },
        sand: {
          50: "#fbf8f3",
          100: "#f3ede1",
          200: "#e8dbc1",
          300: "#dbc091",
          400: "#cfa160",
          500: "#c1853f",
          600: "#ac6d34",
          700: "#8f542d",
          800: "#75442b",
          900: "#613928"
        }
      },
      boxShadow: {
        soft: "0 18px 50px -24px rgba(24, 57, 48, 0.35)",
        insetGlow: "inset 0 1px 0 rgba(255,255,255,0.15)"
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at top right, rgba(46, 139, 110, 0.18), transparent 28%), radial-gradient(circle at 20% 20%, rgba(193, 133, 63, 0.18), transparent 22%), linear-gradient(135deg, rgba(24,57,48,0.96), rgba(20,32,31,0.92))",
        "page-mesh":
          "radial-gradient(circle at top, rgba(46,139,110,0.12), transparent 25%), radial-gradient(circle at bottom left, rgba(193,133,63,0.10), transparent 20%)"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        floatIn: "floatIn 450ms ease-out both"
      }
    }
  },
  plugins: []
};

export default config;

