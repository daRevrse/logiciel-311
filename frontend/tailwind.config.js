/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2F6FED',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A5F',
        },
        deep: '#1E3A5F',
        support: {
          DEFAULT: '#2BB673',
          light:   '#6ED3A3',
          dark:    '#1D8A56',
        },
        surface: '#F5F7FA',
        muted:   '#6B7280',
        'surface-container-lowest':  '#ffffff',
        'surface-container-low':     '#f2f4f7',
        'surface-container':         '#eceef1',
        'surface-container-high':    '#e6e8eb',
        'surface-container-highest': '#e0e3e6',
        'primary-container':         '#2f6fed',
        'tertiary-container':        '#008851',
        'tertiary-fixed':            '#7afbb1',
        'outline-variant':           '#c2c6d7',
        'on-surface':                '#191c1e',
        'on-surface-variant':        '#424654',
      },
      fontFamily: {
        sans:     ['Inter', 'system-ui', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
