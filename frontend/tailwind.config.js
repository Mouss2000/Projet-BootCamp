/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: 'var(--color-bg-900)',
          800: 'var(--color-bg-800)',
          700: 'var(--color-bg-700)',
          600: 'var(--color-bg-600)',
          500: 'var(--color-bg-500)',
          400: 'var(--color-bg-400)',
        },
        main: 'var(--color-text-main)',
        muted: 'var(--color-text-muted)',
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
    },
  },
  plugins: [],
}