/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
      },
    },
  },
  plugins: [],
}
