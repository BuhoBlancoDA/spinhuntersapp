/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0d10',
        card: '#111317',
        foreground: '#e5e7eb',
        muted: '#9aa0a6',
        brand: {
          DEFAULT: '#d92a2e', // rojo SpinHunters
          50: '#ffe5e7',
          100: '#ffcdd0',
          200: '#f89da2',
          300: '#ee6a71',
          400: '#e4434b',
          500: '#d92a2e',
          600: '#c01f23',
          700: '#9a191d',
          800: '#7a1519',
          900: '#4b0c0f',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.45), 0 0 40px rgba(217,42,46,0.15)',
      },
      minHeight: {
        dvh: '100dvh',
      },
    },
  },
  plugins: [],
}
