import type { Config } from 'tailwindcss';

// Paleta e tipografia — fonte da verdade: docs/design-system.md.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#EAF0F5',
          100: '#CBDCE8',
          200: '#9CB9D0',
          400: '#1E4E77',
          500: '#123A5C',
          600: '#0A2540',
          700: '#081D33',
          900: '#051220',
        },
        teal: {
          50: '#E6F7F5',
          100: '#C0EDE9',
          200: '#8EDDD6',
          400: '#2BC2B7',
          500: '#1AA79E',
          600: '#158D85',
          700: '#0F6E68',
        },
        sun: {
          50: '#FEF6E7',
          100: '#FCE8C2',
          300: '#F6C868',
          400: '#F2B441',
          500: '#E8A33D',
        },
      },
      fontFamily: {
        display: ['var(--font-poppins)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
