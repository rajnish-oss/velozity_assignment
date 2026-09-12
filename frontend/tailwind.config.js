/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Deep ink-teal sidebar system (Slack-like chrome, distinct palette)
        ink: {
          900: '#0B1517',
          800: '#0F1B1E',
          700: '#152528',
          600: '#1C3034',
          500: '#274347',
          400: '#3D5A5E',
        },
        amber: {
          50: '#FFF8EB',
          100: '#FEECC7',
          300: '#F8C766',
          500: '#F5A623',
          600: '#DB8B0E',
          700: '#B06F0A',
        },
        canvas: '#F7F7F5',
        line: '#E4E3DF',
        ink900text: '#1A1D1D',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 27, 30, 0.06), 0 1px 0 rgba(15,27,30,0.04)',
      },
    },
  },
  plugins: [],
}
