/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        muted: '#64748b',
        soft: '#f8faff',
        line: 'rgba(17, 24, 39, 0.08)',
        accent: '#2563eb',
        cyan: '#06b6d4',
        blush: '#fb7185',
        mint: '#34d399',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        site: '74rem',
      },
    },
  },
  plugins: [],
};
