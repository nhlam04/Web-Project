/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.06)',
        'card': '0 4px 16px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 12px 32px rgba(15, 23, 42, 0.10)',
        'elevated': '0 20px 45px rgba(15, 23, 42, 0.12)',
        'button': '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.10)',
        'button-hover': '0 4px 12px rgba(37, 99, 235, 0.25)',
        'ring': '0 0 0 3px rgba(37, 99, 235, 0.15)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}