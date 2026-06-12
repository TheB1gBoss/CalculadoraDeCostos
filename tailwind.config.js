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
        /* Paleta dark "rayo" — refinada: grafito neutro + cian suave */
        ray: {
          bg:      '#0a0d12',
          surface: '#13181f',
          border:  '#262d37',
          cyan:    '#3fcbe0',
          'cyan-dim': '#12262b',
          'cyan-glow': 'rgba(63,203,224,0.10)',
        },
        /* "amber" redefinido como ORO metálico (se aplica a todo lo dorado) */
        amber: {
          50:  '#fbf6e7',
          100: '#f6ecc6',
          200: '#efd99a',
          300: '#e8cf7a',
          400: '#e3c05a',
          500: '#d4af37',
          600: '#b8902a',
          700: '#8a6a22',
          800: '#6b521b',
          900: '#4a3a14',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(63,203,224,0.16)',
        'glow-sm':   '0 0 10px rgba(63,203,224,0.09)',
      },
    },
  },
  plugins: [],
}
