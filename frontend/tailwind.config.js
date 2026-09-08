/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0B1220',
        darkCard: '#111827',
        darkCardElevated: '#172033',
        darkBorder: '#1E293B',
        darkBorderSubtle: '#334155',
        primary: {
          DEFAULT: '#3B82F6', // Professional Blue
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3B82F6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#172554',
        },
        aiCyan: {
          DEFAULT: '#06B6D4', // Cyan AI accent
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06B6D4',
          600: '#0891b2',
        },
        growthEmerald: {
          DEFAULT: '#10B981', // Growth / Success
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10B981',
          600: '#059669',
        },
        slateText: {
          main: '#F8FAFC',
          muted: '#94A3B8',
        },
        electric: {
          DEFAULT: '#3B82F6',
          400: '#60a5fa',
          500: '#3B82F6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#172554',
        },
        tealBrand: {
          DEFAULT: '#06B6D4',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06B6D4',
          600: '#0891b2',
          700: '#0e7490',
        },
        coralBrand: {
          DEFAULT: '#F97316',
          400: '#fb923c',
          500: '#F97316',
          600: '#ea580c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
        'glow': '0 0 25px rgba(59, 130, 246, 0.25)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.25)',
      }
    },
  },
  plugins: [],
}
