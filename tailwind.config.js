/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16201A',
        surface: '#F1F3F0',
        card: '#FFFFFF',
        line: '#E4E7E2',
        muted: '#6B7280',
        positive: '#0E7C5A',
        negative: '#C2410C',
        invest: '#1D4ED8',
        transfer: '#7C6F5B',
        brand: '#0B3D2E',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 32, 26, 0.04), 0 8px 24px -16px rgba(16, 32, 26, 0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
