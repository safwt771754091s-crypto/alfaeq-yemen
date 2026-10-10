/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Kufi Arabic"', '"Tajawal"', 'system-ui', 'sans-serif'],
        display: ['"Tajawal"', '"Noto Kufi Arabic"', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#ecfdf7',
          100: '#d1faec',
          200: '#a7f3da',
          300: '#6ee7c4',
          400: '#34d3a9',
          500: '#10b98d',
          600: '#059574',
          700: '#04775f',
          800: '#065f4d',
          900: '#064e41',
          950: '#022c25'
        },
        sand: {
          50: '#fbf8f1',
          100: '#f6efdd',
          200: '#ecdcb9',
          300: '#e0c48c',
          400: '#d3a75e',
          500: '#c8903f',
          600: '#b07533',
          700: '#925a2c',
          800: '#78492a',
          900: '#643d26'
        }
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.18)',
        card: '0 1px 3px rgba(16,24,40,0.06), 0 12px 32px -16px rgba(16,24,40,0.22)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'slide-in': { '0%': { opacity: 0, transform: 'translateX(24px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } }
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out both',
        'slide-in': 'slide-in .35s ease-out both'
      }
    }
  },
  plugins: []
};
