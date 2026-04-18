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
          50: "rgb(var(--color-brand-50) / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          200: "rgb(var(--color-brand-200) / <alpha-value>)",
          300: "rgb(var(--color-brand-300) / <alpha-value>)",
          400: "rgb(var(--color-brand-400) / <alpha-value>)",
          500: "rgb(var(--color-brand-500) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
          800: "rgb(var(--color-brand-800) / <alpha-value>)",
          900: "rgb(var(--color-brand-900) / <alpha-value>)",
        },
        ink: {
          50: "rgb(var(--color-ink-50) / <alpha-value>)",
          100: "rgb(var(--color-ink-100) / <alpha-value>)",
          200: "rgb(var(--color-ink-200) / <alpha-value>)",
          300: "rgb(var(--color-ink-300) / <alpha-value>)",
          400: "rgb(var(--color-ink-400) / <alpha-value>)",
          500: "rgb(var(--color-ink-500) / <alpha-value>)",
          600: "rgb(var(--color-ink-600) / <alpha-value>)",
          700: "rgb(var(--color-ink-700) / <alpha-value>)",
          800: "rgb(var(--color-ink-800) / <alpha-value>)",
          900: "rgb(var(--color-ink-900) / <alpha-value>)",
          950: "rgb(var(--color-ink-950) / <alpha-value>)",
        },
        sand: {
          50: "rgb(var(--color-sand-50) / <alpha-value>)",
          100: "rgb(var(--color-sand-100) / <alpha-value>)",
          200: "rgb(var(--color-sand-200) / <alpha-value>)",
          300: "rgb(var(--color-sand-300) / <alpha-value>)",
          400: "rgb(var(--color-sand-400) / <alpha-value>)",
          500: "rgb(var(--color-sand-500) / <alpha-value>)",
          600: "rgb(var(--color-sand-600) / <alpha-value>)",
          700: "rgb(var(--color-sand-700) / <alpha-value>)",
          800: "rgb(var(--color-sand-800) / <alpha-value>)",
          900: "rgb(var(--color-sand-900) / <alpha-value>)",
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
