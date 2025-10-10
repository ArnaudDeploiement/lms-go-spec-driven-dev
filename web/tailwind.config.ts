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
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)"
        },
        subtle: {
          DEFAULT: "var(--subtle)",
          foreground: "var(--subtle-foreground)"
        },
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          hover: "var(--surface-hover)"
        },
        border: "var(--border)",
        ring: "var(--ring)",
        card: "var(--surface)",
        "card-foreground": "var(--foreground)",
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          muted: "var(--accent-muted)"
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)"
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)"
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)"
        }
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.75rem"
      },
      boxShadow: {
        panel: "0 20px 60px -40px rgba(0, 0, 0, 0.95)",
        subtle: "0 32px 80px -60px rgba(0, 0, 0, 0.8)",
        focus: "0 0 0 1px var(--ring)"
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
