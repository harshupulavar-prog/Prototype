/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Kaara brand
        kaara: {
          50: '#FEF2F3',
          100: '#FDE4E6',
          200: '#FBCDD1',
          300: '#F7A3AA',
          400: '#F06873',
          500: '#E91D2B', // primary
          600: '#D1131F',
          700: '#B00F1A',
          800: '#8E111A',
          900: '#74141B',
        },
        charcoal: {
          DEFAULT: '#171A24',
          700: '#2A2E3B',
          500: '#5B6070',
          400: '#8A8F9E',
        },
        surface: '#F8F9FB',
        line: '#E7E9EE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 26, 36, 0.04)',
        lift: '0 8px 24px -8px rgba(23, 26, 36, 0.12)',
        modal: '0 24px 64px -16px rgba(23, 26, 36, 0.28)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
    },
  },
  plugins: [],
};
