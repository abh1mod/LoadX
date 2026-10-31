/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          'primary-light': 'var(--color-primary-light)',
          'primary-border': 'var(--color-primary-border)',
          sidebar: 'var(--color-sidebar)',
          'sidebar-secondary': 'var(--color-sidebar-secondary)',
          'sidebar-active': 'var(--color-sidebar-active)',
          'sidebar-text': 'var(--color-sidebar-text)',
          'sidebar-muted': 'var(--color-sidebar-text-muted)',
          bg: 'var(--color-background)',
          'bg-secondary': 'var(--color-background-secondary)',
          card: 'var(--color-card)',
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-muted': 'var(--color-text-muted)',
          border: 'var(--color-border)',
          'border-subtle': 'var(--color-border-subtle)',
        },
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#1E1B4B',
          950: '#0F172A',
          DEFAULT: 'var(--color-primary)'
        },
        navy: {
          DEFAULT: '#101D35',
          dark: '#0A1222',
          light: '#3156D9'
        },
        accent: {
          teal: '#0D9488',
          amber: '#D97706',
          DEFAULT: '#0D9488'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: 'var(--color-background)',
          border: 'var(--color-border)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        hover: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.03)'
      }
    }
  },
  plugins: []
}
