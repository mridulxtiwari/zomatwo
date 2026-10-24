/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          500: '#E23744', // Zomato Primary Red
          600: '#CB202D', // Primary Hover Dark
          700: '#9F1239',
        },
        dark: {
          surface: '#0F172A',
          card: '#1E293B',
          text: '#1C1C27',
        },
        gold: {
          400: '#F59E0B',
          500: '#D4AF37', // Zomatwo Gold
        },
        veg: '#16A34A',
        nonveg: '#EA580C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.12)',
        'glow-red': '0 0 25px -5px rgba(226, 55, 68, 0.4)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.7, transform: 'scale(1.08)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
