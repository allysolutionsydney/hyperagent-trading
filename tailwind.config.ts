import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark backgrounds for trading UI
        'dark-bg': '#0a0a0f',
        'dark-surface': '#12121a',
        'dark-panel': '#1a1a2e',
        'dark-card': '#16213e',

        // Trading colors
        'profit': '#10b981',
        'profit-light': '#34d399',
        'profit-dark': '#059669',
        'loss': '#ef4444',
        'loss-light': '#f87171',
        'loss-dark': '#dc2626',

        // Neutral grays
        'gray-800': '#1f2937',
        'gray-700': '#374151',
        'gray-600': '#4b5563',
        'gray-500': '#6b7280',
        'gray-400': '#9ca3af',

        // Chart colors
        'chart-bull': '#10b981',
        'chart-bear': '#ef4444',
        'chart-grid': '#374151',
        'chart-text': '#d1d5db',

        // UI accent
        'accent-blue': '#3b82f6',
        'accent-blue-dark': '#1e40af',
        'accent-yellow': '#f59e0b',
      },
      backgroundColor: {
        'primary': '#0a0a0f',
        'secondary': '#12121a',
        'tertiary': '#1a1a2e',
      },
      textColor: {
        'primary': '#f3f4f6',
        'secondary': '#d1d5db',
        'tertiary': '#9ca3af',
      },
      borderColor: {
        'primary': '#374151',
        'secondary': '#4b5563',
      },
      spacing: {
        'chart': '20px',
      },
      fontSize: {
        'chart': ['12px', '16px'],
      },
      gridTemplateColumns: {
        'trading': 'repeat(auto-fit, minmax(250px, 1fr))',
      },
    },
  },
  plugins: [],
}

export default config
