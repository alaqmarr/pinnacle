/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom industrial packaging palette tokens
        brand: {
          navy: '#0f172a',        // slate-900: Header, primary buttons, hero background
          slate: '#1e293b',       // slate-800: Admin sidebar, dark card headers
          dark: '#334155',        // slate-700: Dividers, secondary text on dark
          blue: '#0284c7',        // sky-600: Primary links, interactive tabs, badges
          'blue-hover': '#0369a1', // sky-700: Link/button hover state
          amber: '#f59e0b',       // amber-500: High-visibility safety accent, sale tags
          'amber-dark': '#d97706', // amber-600: Warning states, urgent badges
          surface: '#f8fafc',     // slate-50: Main application canvas
          card: '#ffffff',        // white: Product card surfaces, modal bodies
          border: '#e2e8f0',      // slate-200: Card borders, input borders
          muted: '#94a3b8',       // slate-400: Placeholders, muted labels
        },
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  // Strictly zero external component library plugins
  plugins: [],
};
