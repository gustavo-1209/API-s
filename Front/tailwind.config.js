/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Paleta Turquesa Corporativo — UrbanCar EC
         *
         * Calibrada para cumplir **WCAG 2.2 AA** sobre fondo blanco/turquesa:
         *   - texto blanco sobre `primary-700` -> ratio 5.55:1 (AA)
         *   - texto blanco sobre `primary-800` -> ratio 8.20:1 (AAA)
         *   - texto blanco sobre `primary-900` -> ratio 12.2:1 (AAA)
         *   - texto `primary-700` sobre blanco -> ratio 5.55:1 (AA)
         *
         * El tono "brand" (`#00CED1`) se reserva para fondos decorativos donde
         * el texto/icono encima es DARK (no blanco), o para gradientes amplios
         * y bordes/acentos.
         */
        primary: {
          DEFAULT: '#00CED1',   // Dark Turquoise — color de marca (decorativo)
          50:  '#E6FBFB',
          100: '#CCF7F8',
          200: '#99EFF1',
          300: '#66E7EA',
          400: '#33DFE3',
          500: '#00CED1',
          600: '#009091',
          700: '#007577',       // ← AA texto blanco sobre primary-700 (botón)
          800: '#005A5C',       // ← AAA
          900: '#003E40'        // ← AAA — sidebar / header oscuro
        },
        dark: {
          DEFAULT: '#005A5C',   // = primary-800
          deeper:  '#003E40'    // = primary-900
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted:   '#F8FAFC',
          border:  '#E2E8F0'
        },
        ink: {
          DEFAULT: '#0F172A',
          muted:   '#475569',
          soft:    '#94A3B8'
        },
        danger:  '#DC2626',
        warning: '#D97706',
        info:    '#2563EB'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        soft:  '0 2px 10px rgba(0, 139, 139, 0.08)',
        card:  '0 6px 24px rgba(0, 139, 139, 0.12)',
        focus: '0 0 0 3px rgba(0, 206, 209, 0.35)'
      },
      borderRadius: {
        xl:  '0.875rem',
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
};
