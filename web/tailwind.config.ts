import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1320px"
      }
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        // Revolut-inspired color palette
        revolut: {
          black: "#000000",
          darkGray: "#1A1A1A",
          gray: "#2D2D2D",
          lightGray: "#F5F5F5",
          purple: "#8B5CF6",
          violet: "#A855F7",
          blue: "#3B82F6",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444"
        },
        primary: {
          DEFAULT: "#8B5CF6",  // Revolut purple
          foreground: "#FFFFFF"
        },
        secondary: {
          DEFAULT: "#1A1A1A",  // Revolut dark
          foreground: "#FFFFFF"
        },
        border: "rgba(0, 0, 0, 0.08)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)"
      },
      borderRadius: {
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem"
      },
      boxShadow: {
        brand: "0 10px 40px -20px rgba(139, 92, 246, 0.45)",
        revolut: "0 4px 24px -2px rgba(0, 0, 0, 0.08), 0 2px 8px -1px rgba(0, 0, 0, 0.04)",
        "revolut-hover": "0 8px 32px -4px rgba(0, 0, 0, 0.12), 0 4px 16px -2px rgba(0, 0, 0, 0.08)",
        "revolut-card": "0 1px 3px 0 rgba(0, 0, 0, 0.08)"
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" }
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      },
      animation: {
        shimmer: "shimmer 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out"
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addVariant }) => {
      addVariant("sidebar-expanded", ".sidebar-expanded &");
    })
  ]
};

export default config;
