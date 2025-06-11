/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#101827',      // Deep graphite
        accent: '#F43F5E',       // Soft crimson
        background: '#F8FAFC',   // Clean off-white
        surface: '#FFFFFF',      // White cards
        'text-primary': '#111827',  // Rich dark slate
        'text-muted': '#6B7280',    // Cool gray
        success: '#10B981',      // Confident green
        warning: '#F59E0B',      // Gold-amber
        error: '#EF4444',        // Strategic red
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
} 