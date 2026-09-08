/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A8A', // Deep Blue
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1E3A8A',
        },
        electric: {
          DEFAULT: '#7C3AED', // Electric Purple
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7C3AED',
          700: '#6d28d9',
        },
        tealBrand: {
          DEFAULT: '#14B8A6',
          400: '#2dd4bf',
          500: '#14B8A6',
          600: '#0d9488',
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
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.16)',
        'glow': '0 0 25px rgba(124, 58, 237, 0.25)',
      }
    },
  },
  plugins: [],
}
