/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // As cores apontam para variáveis CSS (canais RGB), definidas em
      // index.css para os temas claro (:root) e escuro (.dark). Isso mantém
      // os modificadores de opacidade do Tailwind funcionando (ex.: bg-ink/40).
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        positive: 'rgb(var(--c-positive) / <alpha-value>)',
        negative: 'rgb(var(--c-negative) / <alpha-value>)',
        invest: 'rgb(var(--c-invest) / <alpha-value>)',
        transfer: 'rgb(var(--c-transfer) / <alpha-value>)',
        brand: 'rgb(var(--c-brand) / <alpha-value>)',
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
