/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fc',
          400: '#36a7f8',
          500: '#0c8ee9',
          600: '#006fc7',
          700: '#0059a1',
          800: '#054c85',
          900: '#0a406e',
        },
        surface: {
          0: '#ffffff',
          1: '#f8f9fb',
          2: '#f1f3f6',
          3: '#e9ecf0',
        },
        ink: {
          primary:   '#111827',
          secondary: '#374151',
          tertiary:  '#6b7280',
          disabled:  '#9ca3af',
          inverse:   '#ffffff',
        },
        status: {
          success: '#16a34a',
          warning: '#d97706',
          danger:  '#dc2626',
          info:    '#0c8ee9',
        }
      },
      boxShadow: {
        card:   '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        elevated:'0 4px 12px 0 rgba(0,0,0,0.08), 0 1px 3px 0 rgba(0,0,0,0.05)',
        focus:  '0 0 0 3px rgba(12,142,233,0.25)',
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.25rem',
      }
    },
  },
  plugins: [],
}
