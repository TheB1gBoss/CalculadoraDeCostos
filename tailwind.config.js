/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef4ff',
          100: '#d9e7ff',
          500: '#0066cc',
          600: '#0057b3',
          700: '#004899',
        },
        /* Paleta dark "rayo" */
        ray: {
          bg:      '#050b18',
          surface: '#0b1628',
          border:  '#152338',
          cyan:    '#00d4ff',
          'cyan-dim': '#001e33',
          'cyan-glow': 'rgba(0,212,255,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(0,212,255,0.18)',
        'glow-sm':   '0 0 10px rgba(0,212,255,0.10)',
      },
    },
  },
  plugins: [],
}
