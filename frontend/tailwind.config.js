/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#4f46e5",
          foreground: "#ffffff",
          hover: "#4338ca",
        },
        secondary: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f8fafc",
          foreground: "#64748b",
        },
        accent: {
          DEFAULT: "#e0e7ff",
          foreground: "#3730a3",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        success: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
          light: "#ecfdf5",
          border: "#a7f3d0",
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
          light: "#fffbeb",
          border: "#fde68a",
        },
        critical: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
          light: "#fef2f2",
          border: "#fecaca",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
