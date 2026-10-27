/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf7ee',
          100: '#f4ebd5',
          200: '#ead4ab',
          300: '#ddb779',
          400: '#d19c4d',
          500: '#b87c2c',
          600: '#9b6022',
          700: '#7a471e',
          800: '#64391e',
          900: '#54301c',
          950: '#2f170c',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        paper: {
          light: '#fdfbf7',
          warm: '#f9f5eb',
          dark: '#13151a',
          surface: '#1b1e26',
          border: '#2a2e3a'
        }
      },
      fontFamily: {
        vazir: ['Vazirmatn', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'lifted': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
