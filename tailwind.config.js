/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Cairo"', '"Tajawal"', '"Noto Kufi Arabic"', 'system-ui', 'sans-serif'],
        display: ['"Cairo"', '"Tajawal"', 'sans-serif']
      },
      colors: {
        // لوحة مستوحاة من منصة المعلم الليبي: أخضر مائي (Teal) + ذهبي
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e'
        },
        sand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        navy: {
          700: '#1a3a5c',
          800: '#12304d',
          900: '#0b1f3a',
          950: '#061428'
        }
      },
      boxShadow: {
        soft: '0 2px 10px rgba(15,118,110,0.06), 0 10px 28px -14px rgba(15,118,110,0.20)',
        card: '0 4px 24px rgba(15,118,110,0.08)',
        lg: '0 12px 48px rgba(15,118,110,0.12)'
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #0b1f3a 100%)',
        'brand-gradient': 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        'gold-gradient': 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'slide-in': { '0%': { opacity: 0, transform: 'translateX(24px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } }
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out both',
        'slide-in': 'slide-in .35s ease-out both',
        float: 'float 7s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
