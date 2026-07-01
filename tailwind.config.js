/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Engraved-banknote / ledger palette
        paper:    '#E9E3D2', // aged note paper
        paper2:   '#F2EEE1', // lighter card surface
        ink:      '#1C2620', // engraving ink (near-black green)
        currency: '#234A3C', // deep banknote green (primary)
        currency2:'#2F6450', // lighter green
        brass:    '#B0894A', // foil / coin gold (accent)
        brass2:   '#C9A24B',
        oxblood:  '#7E3030', // negatives / danger
        sage:     '#BFC4AC', // muted secondary
        line:     '#C8C0A8', // hairline rules
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Work Sans', 'system-ui', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      fontFeatureSettings: {
        tnum: '"tnum" 1, "lnum" 1',
      },
      boxShadow: {
        note: '0 1px 0 rgba(28,38,32,0.05), 0 12px 30px -18px rgba(28,38,32,0.45)',
      },
    },
  },
  plugins: [],
}
